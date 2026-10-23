import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, KVLinkRecord, UserKVAdProfile, ShortLink, User } from './types';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { linksRouter } from './routes/links';
import { analyticsRouter } from './routes/analytics';
import { isCrawlerBot, renderOpenGraphPreviewHtml } from './services/bot-detector';
import { recordClickAnalytics } from './services/analytics-tracker';
import { renderInterstitialHtml } from './services/interstitial';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for API
app.use(
  '/api/*',
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })
);

// Mount API routers
app.route('/api/v1/auth', authRouter);
app.route('/auth', authRouter);
app.route('/api/v1/user', userRouter);
app.route('/api/v1/links', linksRouter);
app.route('/api/v1/analytics', analyticsRouter);

// Health check endpoint
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    edge_location: (c.req.raw as any).cf?.colo || 'LOCAL',
    timestamp: new Date().toISOString()
  });
});

// Reserved frontend routes that should not be handled as short slugs
const FRONTEND_ROUTES = new Set([
  '',
  'login',
  'dashboard',
  'analytics',
  'settings',
  'api',
  'verify',
  'privacy',
  'terms',
  'report',
  'favicon.ico',
  'favicon.svg',
  'robots.txt',
  'manifest.webmanifest',
  'sw.js',
  'registerSW.js'
]);

// Non-blocking telemetry tracking for sponsor impression, cta click, and skip/completion
app.post('/api/v1/track/event', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const linkId = body.linkId;
  const event = body.event; // 'impression' | 'cta_click' | 'skip'

  if (!linkId || !['impression', 'cta_click', 'skip'].includes(event) || !c.env.DB) {
    return c.json({ success: false }, 400);
  }

  c.executionCtx.waitUntil(
    (async () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const dateWIB = formatter.format(now);
        const isImp = event === 'impression' ? 1 : 0;
        const isCta = event === 'cta_click' ? 1 : 0;
        const isSkip = event === 'skip' ? 1 : 0;

        await c.env.DB.prepare(`
          INSERT INTO link_ad_metrics_daily (id, link_id, date, impressions, cta_clicks, skips_proceeded)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(link_id, date) DO UPDATE SET
            impressions = impressions + excluded.impressions,
            cta_clicks = cta_clicks + excluded.cta_clicks,
            skips_proceeded = skips_proceeded + excluded.skips_proceeded
        `).bind(crypto.randomUUID(), linkId, dateWIB, isImp, isCta, isSkip).run();
      } catch (err) {
        console.error('Error tracking ad event:', err);
      }
    })()
  );

  return c.json({ success: true });
});

// Verify link password / PIN challenge
app.post('/api/v1/links/verify-password', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const slug = (body.slug || '').trim();
  const password = body.password || '';

  if (!slug || !password || !c.env.DB) {
    return c.json({ success: false, error: 'Sandi wajib diisi.' }, 400);
  }

  const link = await c.env.DB
    .prepare('SELECT target_url, password_hash FROM links WHERE slug = ? OR slug = ? COLLATE NOCASE')
    .bind(slug, slug.toLowerCase())
    .first<{ target_url: string; password_hash: string | null }>();

  if (!link || !link.password_hash) {
    return c.json({ success: false, error: 'Tautan tidak valid atau tidak memiliki sandi.' }, 400);
  }

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password + (c.env.JWT_SECRET || 'link_salt'))
  );
  const userHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (userHash !== link.password_hash) {
    return c.json({ success: false, error: 'Kata sandi atau PIN salah. Silakan coba lagi.' }, 401);
  }

  return c.json({ success: true, target_url: link.target_url });
});

// ⚡ Edge Redirection Engine (Sub-15ms Latency)
app.get('/:slug', async (c) => {
  const rawSlug = c.req.param('slug');
  const slug = rawSlug;
  const lowerSlug = rawSlug.toLowerCase();

  // If path contains file extension or is a known frontend route, forward to static assets
  if (rawSlug.includes('.') || FRONTEND_ROUTES.has(lowerSlug)) {
    if (c.env.ASSETS) {
      return await c.env.ASSETS.fetch(c.req.raw);
    }
    return c.notFound();
  }

  const userAgent = c.req.header('user-agent') || '';
  const clientIp = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const appUrl = c.env.APP_URL || new URL(c.req.url).origin;

  // 1. Step 1: Look up slug in Cloudflare KV (Fast-Path Cache)
  // Check exact case first, then fallback to lowercase
  let linkData: KVLinkRecord | null = null;
  if (c.env.LINKS_KV) {
    let rawKV = await c.env.LINKS_KV.get(`link:${rawSlug}`);
    if (!rawKV && rawSlug !== lowerSlug) {
      rawKV = await c.env.LINKS_KV.get(`link:${lowerSlug}`);
    }
    if (rawKV) {
      try {
        linkData = JSON.parse(rawKV);
      } catch {}
    }
  }

  // 2. Step 2: Fallback to D1 Database if KV cache misses, then warm up KV
  if (!linkData && c.env.DB) {
    const d1Row = await c.env.DB
      .prepare('SELECT * FROM links WHERE slug = ? OR slug = ? COLLATE NOCASE')
      .bind(rawSlug, lowerSlug)
      .first<ShortLink>();

    if (d1Row) {
      linkData = {
        id: d1Row.id,
        user_id: d1Row.user_id,
        target_url: d1Row.target_url,
        title: d1Row.title || undefined,
        ad_mode: d1Row.ad_mode,
        ad_skippable: d1Row.ad_skippable !== 0,
        ad_auto_redirect: Boolean(d1Row.ad_auto_redirect),
        password_hash: d1Row.password_hash || undefined,
        expires_at: d1Row.expires_at || undefined,
        max_clicks: d1Row.max_clicks || undefined,
        clicks_count: d1Row.clicks_count || 0,
        og_title: d1Row.og_title || undefined,
        og_description: d1Row.og_description || undefined,
        og_image_url: d1Row.og_image_url || undefined,
        report_token: d1Row.report_token || undefined,
        custom_ad:
          d1Row.ad_mode === 'custom'
            ? {
                type: d1Row.ad_type,
                media_url: d1Row.ad_media_url || '',
                headline: d1Row.ad_headline || '',
                timer_seconds: d1Row.ad_timer_seconds || 5,
                cta_text: d1Row.ad_cta_text || '',
                cta_url: d1Row.ad_cta_url || '',
                skippable: d1Row.ad_skippable !== 0,
                auto_redirect: Boolean(d1Row.ad_auto_redirect)
              }
            : undefined,
        is_active: Boolean(d1Row.is_active)
      };

      // Warm up KV in background for both exact and lowercase slug
      if (c.env.LINKS_KV) {
        c.executionCtx.waitUntil(
          Promise.all([
            c.env.LINKS_KV.put(`link:${d1Row.slug}`, JSON.stringify(linkData)),
            c.env.LINKS_KV.put(`link:${d1Row.slug.toLowerCase()}`, JSON.stringify(linkData))
          ])
        );
      }
    }
  }

  // If link does not exist
  if (!linkData) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Tautan Tidak Ditemukan — Link</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .logo { width: 36px; height: 36px; background: #f4f4f5; color: #09090b; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; margin: 0 auto 20px auto; }
          h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #f4f4f5; }
          p { font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0; }
          a { display: inline-block; background: #f4f4f5; color: #09090b; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; transition: background 0.2s; }
          a:hover { background: #ffffff; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">L</div>
          <h1>Tautan Tidak Ditemukan</h1>
          <p>Tautan yang Anda tuju tidak terdaftar atau telah dihapus oleh pemiliknya.</p>
          <a href="/">Kembali ke Beranda</a>
        </div>
      </body>
      </html>
    `, 404);
  }

  // If link is deactivated by owner
  if (!linkData.is_active) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Tautan Dinonaktifkan — Link</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .logo { width: 36px; height: 36px; background: #f4f4f5; color: #09090b; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; margin: 0 auto 20px auto; }
          h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #f87171; }
          p { font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0; }
          a { display: inline-block; background: #27272a; color: #f4f4f5; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; }
          a:hover { background: #3f3f46; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">L</div>
          <h1>Tautan Dinonaktifkan</h1>
          <p>Pemilik telah menonaktifkan tautan ini untuk sementara waktu.</p>
          <a href="/">Kembali ke Beranda</a>
        </div>
      </body>
      </html>
    `, 403);
  }

  // Check Expiration
  if (linkData.expires_at) {
    const expDate = new Date(linkData.expires_at);
    if (!isNaN(expDate.getTime()) && expDate < new Date()) {
      return c.html(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>Tautan Kedaluwarsa — Link</title>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
            .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            .logo { width: 36px; height: 36px; background: #f59e0b; color: #09090b; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; margin: 0 auto 20px auto; }
            h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #f59e0b; }
            p { font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0; }
            a { display: inline-block; background: #27272a; color: #f4f4f5; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; }
            a:hover { background: #3f3f46; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">⏰</div>
            <h1>Tautan Kedaluwarsa</h1>
            <p>Masa aktif tautan ini telah berakhir sesuai batas waktu yang ditentukan oleh pembuatnya.</p>
            <a href="/">Kembali ke Beranda</a>
          </div>
        </body>
        </html>
      `, 410);
    }
  }

  // Check Max Clicks Limit
  if (linkData.max_clicks && (linkData.clicks_count || 0) >= linkData.max_clicks) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Batas Klik Tercapai — Link</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .logo { width: 36px; height: 36px; background: #f59e0b; color: #09090b; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; margin: 0 auto 20px auto; }
          h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #f59e0b; }
          p { font-size: 13px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0; }
          a { display: inline-block; background: #27272a; color: #f4f4f5; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; }
          a:hover { background: #3f3f46; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🛑</div>
          <h1>Batas Klik Tercapai</h1>
          <p>Tautan ini telah mencapai jumlah klik maksimal yang dialokasikan oleh pembuatnya.</p>
          <a href="/">Kembali ke Beranda</a>
        </div>
      </body>
      </html>
    `, 410);
  }

  // 3. Step 3: Indonesian Edge Case - Social Media Link Preview Crawler Bot Filter
  // WhatsApp / FB / Telegram / Twitter scrapers must receive dynamic OpenGraph tags with 200 OK
  // and MUST NOT be counted towards real human click metrics!
  if (isCrawlerBot(userAgent)) {
    let previewImg = linkData.og_image_url || '';
    if (!previewImg && linkData.custom_ad && linkData.custom_ad.type === 'image') {
      previewImg = linkData.custom_ad.media_url;
    }
    const ogHtml = renderOpenGraphPreviewHtml({
      title: linkData.og_title || linkData.title || `Tautan Link - ${slug}`,
      description: linkData.og_description || 'Klik untuk membuka tautan tujuan.',
      imageUrl: previewImg,
      targetUrl: linkData.target_url,
      slug,
      appUrl
    });
    return c.html(ogHtml, 200);
  }

  // 4. Step 4: Record Human Click Analytics Asynchronously (non-blocking)
  c.executionCtx.waitUntil(
    recordClickAnalytics({
      env: c.env,
      linkId: linkData.id,
      req: c.req.raw,
      userAgent,
      clientIp
    })
  );

  // 5. Step 5: Password challenge if ad is disabled but link is password protected
  if (linkData.ad_mode === 'disabled' && linkData.password_hash) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Verifikasi Sandi — Link</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body { margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#09090b; color:#fafafa; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:16px; box-sizing:border-box; }
          .card { background:#18181b; border:1px solid #27272a; border-radius:16px; padding:32px 24px; max-width:360px; width:100%; text-align:center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); }
          .icon { width:42px; height:42px; background:#27272a; color:#fafafa; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px; }
          h1 { font-size:16px; font-weight:600; margin:0 0 6px 0; color:#fafafa; }
          p { font-size:12px; color:#a1a1aa; margin:0 0 16px 0; }
          .err { font-size:11px; color:#f87171; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:8px 10px; margin-bottom:12px; display:none; }
          input { width:100%; background:#09090b; border:1px solid #27272a; color:#fafafa; border-radius:8px; padding:10px 14px; font-size:13px; box-sizing:border-box; margin-bottom:12px; outline:none; text-align:center; letter-spacing:0.1em; }
          input:focus { border-color:#71717a; }
          button { width:100%; background:#ffffff; color:#09090b; font-weight:600; font-size:13px; border:0; border-radius:8px; padding:10px; cursor:pointer; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1>Tautan Dilindungi Sandi</h1>
          <p>Masukkan kata sandi atau PIN untuk melanjutkan ke tautan tujuan.</p>
          <div id="err" class="err"></div>
          <form onsubmit="verify(event)">
            <input type="password" id="pwd" placeholder="Masukkan PIN / Sandi" required autofocus />
            <button type="submit" id="btn">Buka Tautan</button>
          </form>
        </div>
        <script>
          function verify(e) {
            e.preventDefault();
            var pwd = document.getElementById('pwd').value;
            var btn = document.getElementById('btn');
            var err = document.getElementById('err');
            err.style.display = 'none';
            btn.disabled = true;
            btn.innerText = 'Memverifikasi...';
            fetch('/api/v1/links/verify-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug: "${slug}", password: pwd })
            })
            .then(function(r){ return r.json(); })
            .then(function(d){
              if (d.success && d.target_url) {
                window.location.href = d.target_url;
              } else {
                err.innerText = d.error || 'Kata sandi salah.';
                err.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Buka Tautan';
              }
            })
            .catch(function(){
              err.innerText = 'Gagal memverifikasi.';
              err.style.display = 'block';
              btn.disabled = false;
              btn.innerText = 'Buka Tautan';
            });
          }
        </script>
      </body>
      </html>
    `, 200);
  }

  // 6. Step 6: Dual Redirection & Ad Hierarchy Resolution
  // Case A: Forced disabled ad (Direct 302)
  if (linkData.ad_mode === 'disabled') {
    return c.redirect(linkData.target_url, 302);
  }

  // Case B: Custom ad per-URL
  if (linkData.ad_mode === 'custom' && linkData.custom_ad && linkData.custom_ad.media_url) {
    const isIAB = /fban|fbav|instagram|tiktok|musical_ly/i.test(userAgent);
    const html = renderInterstitialHtml({
      slug,
      linkId: linkData.id,
      targetUrl: linkData.target_url,
      adType: linkData.custom_ad.type === 'youtube' ? 'youtube' : 'image',
      mediaUrl: linkData.custom_ad.media_url,
      headline: linkData.custom_ad.headline,
      timerSeconds: linkData.custom_ad.timer_seconds,
      ctaText: linkData.custom_ad.cta_text,
      ctaUrl: linkData.custom_ad.cta_url,
      skippable: linkData.custom_ad.skippable !== false && linkData.ad_skippable !== false,
      autoRedirect: Boolean(linkData.custom_ad.auto_redirect || linkData.ad_auto_redirect),
      hasPassword: Boolean(linkData.password_hash),
      isIAB
    });
    return c.html(html, 200);
  }

  // Case C: Inherit from Global User Ad Setting
  if (linkData.ad_mode === 'inherit') {
    let globalAd: UserKVAdProfile | null = null;

    // Check KV key user_ad:{user_id}
    if (c.env.LINKS_KV) {
      const rawUserAd = await c.env.LINKS_KV.get(`user_ad:${linkData.user_id}`);
      if (rawUserAd) {
        try {
          globalAd = JSON.parse(rawUserAd);
        } catch {}
      }
    }

    // Fallback to D1 if KV miss
    if (!globalAd && c.env.DB) {
      const userRow = await c.env.DB
        .prepare('SELECT * FROM users WHERE id = ?')
        .bind(linkData.user_id)
        .first<User>();

      if (userRow && userRow.global_ad_enabled) {
        globalAd = {
          global_enabled: Boolean(userRow.global_ad_enabled),
          type: userRow.global_ad_type || 'none',
          media_url: userRow.global_ad_media_url || '',
          headline: userRow.global_ad_headline || '',
          timer_seconds: userRow.global_ad_timer_seconds || 5,
          cta_text: userRow.global_ad_cta_text || '',
          cta_url: userRow.global_ad_cta_url || '',
          skippable: userRow.global_ad_skippable !== 0,
          auto_redirect: Boolean(userRow.global_ad_auto_redirect)
        };

        // Cache in KV
        if (c.env.LINKS_KV) {
          c.executionCtx.waitUntil(
            c.env.LINKS_KV.put(`user_ad:${linkData.user_id}`, JSON.stringify(globalAd))
          );
        }
      }
    }

    // If global ad is active and valid
    if (globalAd && globalAd.global_enabled && globalAd.media_url && globalAd.type !== 'none') {
      const isIAB = /fban|fbav|instagram|tiktok|musical_ly/i.test(userAgent);
      const html = renderInterstitialHtml({
        slug,
        linkId: linkData.id,
        targetUrl: linkData.target_url,
        adType: globalAd.type === 'youtube' ? 'youtube' : 'image',
        mediaUrl: globalAd.media_url,
        headline: globalAd.headline,
        timerSeconds: globalAd.timer_seconds,
        ctaText: globalAd.cta_text,
        ctaUrl: globalAd.cta_url,
        skippable: globalAd.skippable !== false && linkData.ad_skippable !== false,
        autoRedirect: Boolean(globalAd.auto_redirect || linkData.ad_auto_redirect),
        hasPassword: Boolean(linkData.password_hash),
        isIAB
      });
      return c.html(html, 200);
    }
  }

  // Default: Instant Direct 302 Redirection
  return c.redirect(linkData.target_url, 302);
});

// Fallback to Cloudflare Pages static assets for all other routes (PWA Single Page App)
app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return await c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Link PWA Frontend', 200);
});

export default app;
