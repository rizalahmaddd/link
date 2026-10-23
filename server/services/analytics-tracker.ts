import { Env } from '../types';

interface TrackEventParams {
  env: Env;
  linkId: string;
  req: Request;
  userAgent: string;
  clientIp: string;
}

export async function recordClickAnalytics({
  env,
  linkId,
  req,
  userAgent,
  clientIp
}: TrackEventParams): Promise<void> {
  try {
    const cf = (req as any).cf || {};
    const headers = req.headers;

    // 1. Timezone WIB (Asia/Jakarta)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const dateWIB = formatter.format(now); // e.g. "2026-10-22"

    // 2. UU PDP Compliance: Salted Daily IP Hash for Unique Visitor Counting
    const dailySalt = dateWIB + (env.JWT_SECRET || 'link_secret_fallback');
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(clientIp + userAgent + dailySalt)
    );
    const visitorHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);

    // Check if this visitor already clicked today using KV short cache (TTL 24 hours)
    const uvKey = `uv:${linkId}:${dateWIB}:${visitorHash}`;
    let isUniqueToday = false;
    try {
      const existingUV = await env.LINKS_KV.get(uvKey);
      if (!existingUV) {
        isUniqueToday = true;
        await env.LINKS_KV.put(uvKey, '1', { expirationTtl: 86400 });
      }
    } catch {
      // Fallback if KV not available
      isUniqueToday = true;
    }

    // 3. Extract Referrer
    const rawReferrer = headers.get('referer') || '';
    const referrer = parseReferrer(rawReferrer, userAgent);

    // 4. Extract Device, OS, Browser
    const { device, os, browser } = parseUserAgent(userAgent);

    // 5. Extract Geo & ISP Indonesia from Cloudflare headers
    const rawCountry = cf.country || headers.get('cf-ipcountry') || 'ID';
    const rawRegion = cf.region || headers.get('cf-region') || 'DKI Jakarta';
    const rawCity = cf.city || headers.get('cf-ipcity') || 'Jakarta';
    const rawAsOrg = cf.asOrganization || headers.get('cf-as-organization') || 'Telkomsel / ISP Lokal';
    const ispName = normalizeISP(rawAsOrg);
    const provinceName = normalizeProvince(rawRegion, rawCountry);

    // 6. Asynchronous D1 Upsert (High-efficiency aggregation to save D1 write limits)
    const db = env.DB;
    if (!db) return;

    // Batch queries in D1
    const statements = [
      // Update total clicks count on links table
      db.prepare(`UPDATE links SET clicks_count = clicks_count + 1 WHERE id = ?`).bind(linkId),

      // Upsert daily total and unique visitors
      db.prepare(`
        INSERT INTO link_clicks_daily (id, link_id, date, total_clicks, unique_visitors)
        VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(link_id, date) DO UPDATE SET
          total_clicks = total_clicks + 1,
          unique_visitors = unique_visitors + ?
      `).bind(
        crypto.randomUUID(),
        linkId,
        dateWIB,
        isUniqueToday ? 1 : 0,
        isUniqueToday ? 1 : 0
      ),

      // Breakdown: Referrer
      db.prepare(`
        INSERT INTO link_analytics_breakdown (id, link_id, category, name, count)
        VALUES (?, ?, 'referrer', ?, 1)
        ON CONFLICT(link_id, category, name) DO UPDATE SET count = count + 1
      `).bind(crypto.randomUUID(), linkId, referrer),

      // Breakdown: Device
      db.prepare(`
        INSERT INTO link_analytics_breakdown (id, link_id, category, name, count)
        VALUES (?, ?, 'device', ?, 1)
        ON CONFLICT(link_id, category, name) DO UPDATE SET count = count + 1
      `).bind(crypto.randomUUID(), linkId, device),

      // Breakdown: OS
      db.prepare(`
        INSERT INTO link_analytics_breakdown (id, link_id, category, name, count)
        VALUES (?, ?, 'os', ?, 1)
        ON CONFLICT(link_id, category, name) DO UPDATE SET count = count + 1
      `).bind(crypto.randomUUID(), linkId, os),

      // Breakdown: Browser
      db.prepare(`
        INSERT INTO link_analytics_breakdown (id, link_id, category, name, count)
        VALUES (?, ?, 'browser', ?, 1)
        ON CONFLICT(link_id, category, name) DO UPDATE SET count = count + 1
      `).bind(crypto.randomUUID(), linkId, browser),

      // Breakdown: Province
      db.prepare(`
        INSERT INTO link_analytics_breakdown (id, link_id, category, name, count)
        VALUES (?, ?, 'province', ?, 1)
        ON CONFLICT(link_id, category, name) DO UPDATE SET count = count + 1
      `).bind(crypto.randomUUID(), linkId, provinceName),

      // Breakdown: ISP
      db.prepare(`
        INSERT INTO link_analytics_breakdown (id, link_id, category, name, count)
        VALUES (?, ?, 'isp', ?, 1)
        ON CONFLICT(link_id, category, name) DO UPDATE SET count = count + 1
      `).bind(crypto.randomUUID(), linkId, ispName)
    ];

    await db.batch(statements);
  } catch (err) {
    console.error('Analytics recording error:', err);
  }
}

function parseReferrer(ref: string, ua: string): string {
  const lowRef = ref.toLowerCase();
  const lowUa = ua.toLowerCase();

  if (lowRef.includes('whatsapp') || lowRef.includes('wa.me') || lowUa.includes('whatsapp')) return 'WhatsApp';
  if (lowRef.includes('instagram.com') || lowUa.includes('instagram')) return 'Instagram';
  if (lowRef.includes('facebook.com') || lowRef.includes('fb.me') || lowUa.includes('fbav') || lowUa.includes('fban')) return 'Facebook';
  if (lowRef.includes('tiktok.com') || lowUa.includes('tiktok') || lowUa.includes('musical_ly')) return 'TikTok';
  if (lowRef.includes('t.co') || lowRef.includes('twitter.com') || lowRef.includes('x.com')) return 'Twitter / X';
  if (lowRef.includes('t.me') || lowRef.includes('telegram')) return 'Telegram';
  if (lowRef.includes('google.com') || lowRef.includes('google.co.id')) return 'Google';
  if (lowRef.includes('shopee.co.id')) return 'Shopee';
  if (lowRef.includes('tokopedia.com')) return 'Tokopedia';
  if (lowRef.includes('youtube.com') || lowRef.includes('youtu.be')) return 'YouTube';
  if (!ref) return 'Langsung (Direct / Offline)';

  try {
    const url = new URL(ref);
    return url.hostname.replace('www.', '');
  } catch {
    return 'Lainnya';
  }
}

function parseUserAgent(ua: string): { device: string; os: string; browser: string } {
  const low = ua.toLowerCase();

  // Device
  let device = 'Desktop';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(low)) {
    device = 'Smartphone (Mobile)';
  } else if (/ipad|tablet/i.test(low)) {
    device = 'Tablet';
  }

  // OS
  let os = 'Lainnya';
  if (low.includes('android')) os = 'Android';
  else if (low.includes('iphone') || low.includes('ipad') || low.includes('ios')) os = 'iOS';
  else if (low.includes('windows')) os = 'Windows';
  else if (low.includes('macintosh') || low.includes('mac os')) os = 'macOS';
  else if (low.includes('linux')) os = 'Linux';

  // Browser & In-App Browser (IAB)
  let browser = 'Chrome';
  if (low.includes('fban') || low.includes('fbav')) browser = 'Facebook In-App';
  else if (low.includes('instagram')) browser = 'Instagram In-App';
  else if (low.includes('tiktok') || low.includes('musical_ly')) browser = 'TikTok In-App';
  else if (low.includes('samsungbrowser')) browser = 'Samsung Internet';
  else if (low.includes('edg')) browser = 'Microsoft Edge';
  else if (low.includes('safari') && !low.includes('chrome')) browser = 'Safari';
  else if (low.includes('firefox')) browser = 'Firefox';
  else if (low.includes('chrome')) browser = 'Chrome';

  return { device, os, browser };
}

function normalizeISP(asOrg: string): string {
  const low = asOrg.toLowerCase();
  if (low.includes('telekomunikasi indonesia') || low.includes('telkom') || low.includes('indihome')) return 'Telkom Indonesia / IndiHome';
  if (low.includes('telekomunikasi selular') || low.includes('telkomsel')) return 'Telkomsel';
  if (low.includes('indosat') || low.includes('ooredoo') || low.includes('hutchison') || low.includes('tri')) return 'Indosat Ooredoo Hutchison';
  if (low.includes('xl axiata') || low.includes('axis')) return 'XL Axiata';
  if (low.includes('smartfren')) return 'Smartfren';
  if (low.includes('biznet')) return 'Biznet Networks';
  if (low.includes('myrepublic') || low.includes('innovate')) return 'MyRepublic';
  if (low.includes('first media') || low.includes('link net')) return 'First Media';
  if (low.includes('cbn') || low.includes('cyberindo')) return 'CBN';
  if (low.includes('mnc') || low.includes('play')) return 'MNC Play';
  return asOrg || 'ISP Lainnya';
}

function normalizeProvince(region: string, country: string): string {
  if (country !== 'ID') return `Luar Negeri (${country})`;
  if (!region) return 'DKI Jakarta';
  return region;
}
