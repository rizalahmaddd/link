import { Hono } from 'hono';
import { AppContext, ShortLink, KVLinkRecord } from '../types';
import { getAuthenticatedUser } from '../services/auth';

export const linksRouter = new Hono<AppContext>();

const RESERVED_SLUGS = new Set([
  'api',
  'auth',
  'login',
  'register',
  'dashboard',
  'admin',
  'terms',
  'privacy',
  'assets',
  'favicon.ico',
  'favicon.svg',
  'robots.txt',
  'manifest.webmanifest',
  'sw.js',
  'workbox'
]);

// Auth middleware for all /links routes
linksRouter.use('*', async (c, next) => {
  const user = await getAuthenticatedUser(c.req.raw, c.env);
  if (!user) {
    return c.json({ success: false, error: 'Silakan login terlebih dahulu.' }, 401);
  }
  c.set('user', user);
  await next();
});

// GET /api/v1/links - List user's links
linksRouter.get('/', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  const links = await db
    .prepare(`
      SELECT * FROM links 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `)
    .bind(user.id)
    .all<ShortLink>();

  const mapped = (links.results || []).map((l: any) => ({
    ...l,
    has_password: Boolean(l.password_hash),
    password_hash: undefined
  }));

  return c.json({ success: true, data: mapped });
});

// POST /api/v1/links - Create short link
linksRouter.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  let target_url = (body.target_url || '').trim();
  let slug = (body.slug || '').trim().toLowerCase();
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();

  // Validate Target URL
  if (!target_url) {
    return c.json({ success: false, error: 'URL tujuan wajib diisi.' }, 400);
  }
  if (!/^https?:\/\//i.test(target_url)) {
    target_url = 'https://' + target_url;
  }
  try {
    new URL(target_url);
  } catch {
    return c.json({ success: false, error: 'Format URL tujuan tidak valid.' }, 400);
  }

  // Validate or generate slug
  if (slug) {
    // Alphanumeric + dash, 3-50 chars
    if (!/^[a-z0-9-_]{3,50}$/.test(slug)) {
      return c.json(
        { success: false, error: 'Slug kustom hanya boleh huruf, angka, strip (-), atau underscore (_), panjang 3-50 karakter.' },
        400
      );
    }
    if (RESERVED_SLUGS.has(slug)) {
      return c.json({ success: false, error: `Slug "${slug}" tidak dapat digunakan karena merupakan kata kunci sistem.` }, 400);
    }
  } else {
    // Generate random 5-char slug
    slug = generateRandomSlug(6);
  }

  const db = c.env.DB;

  // Check slug uniqueness
  const existing = await db.prepare('SELECT id FROM links WHERE slug = ?').bind(slug).first();
  if (existing) {
    return c.json({ success: false, error: `Slug "${slug}" sudah digunakan. Silakan pilih slug lain.` }, 409);
  }

  // Ad Settings
  const ad_mode = ['inherit', 'custom', 'disabled'].includes(body.ad_mode)
    ? body.ad_mode
    : 'inherit';
  const ad_type = ['image', 'youtube'].includes(body.ad_type) ? body.ad_type : 'none';
  const ad_media_url = (body.ad_media_url || '').trim();
  const ad_headline = (body.ad_headline || '').trim();
  const ad_timer_seconds = Math.max(1, Math.min(60, Number(body.ad_timer_seconds) || 5));
  const ad_cta_text = (body.ad_cta_text || '').trim();
  const ad_cta_url = (body.ad_cta_url || '').trim();
  const ad_skippable = body.ad_skippable !== false ? 1 : 0;
  const ad_auto_redirect = body.ad_auto_redirect ? 1 : 0;

  // Password / PIN Protection
  const rawPassword = (body.password || '').trim();
  let password_hash: string | null = null;
  if (rawPassword) {
    const hashBuf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(rawPassword + (c.env.JWT_SECRET || 'link_salt'))
    );
    password_hash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Expiration & Limits
  const expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null;
  const max_clicks = Number(body.max_clicks) > 0 ? Number(body.max_clicks) : null;

  // Social Preview Open Graph
  const og_title = (body.og_title || '').trim() || null;
  const og_description = (body.og_description || '').trim() || null;
  const og_image_url = (body.og_image_url || '').trim() || null;

  // Unique report token for client public view
  const report_token = generateRandomSlug(16).toLowerCase();

  // QR Config JSON
  const qr_config = body.qr_config ? JSON.stringify(body.qr_config) : null;

  const newLinkId = crypto.randomUUID();

  // Insert into D1
  await db
    .prepare(`
      INSERT INTO links (
        id, user_id, slug, target_url, title, description,
        ad_mode, ad_type, ad_media_url, ad_headline, ad_timer_seconds, ad_cta_text, ad_cta_url,
        ad_skippable, ad_auto_redirect, password_hash, expires_at, max_clicks,
        og_title, og_description, og_image_url, report_token,
        qr_config, is_active, clicks_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `)
    .bind(
      newLinkId,
      user.id,
      slug,
      target_url,
      title || null,
      description || null,
      ad_mode,
      ad_type,
      ad_media_url || null,
      ad_headline || null,
      ad_timer_seconds,
      ad_cta_text || null,
      ad_cta_url || null,
      ad_skippable,
      ad_auto_redirect,
      password_hash,
      expires_at,
      max_clicks,
      og_title,
      og_description,
      og_image_url,
      report_token,
      qr_config
    )
    .run();

  // Sync to Cloudflare KV for Instant Sub-15ms Edge Redirection
  if (c.env.LINKS_KV) {
    const kvRecord: KVLinkRecord = {
      id: newLinkId,
      user_id: user.id,
      target_url,
      title: title || undefined,
      ad_mode: ad_mode as any,
      ad_skippable: ad_skippable !== 0,
      ad_auto_redirect: Boolean(ad_auto_redirect),
      password_hash: password_hash || undefined,
      expires_at: expires_at || undefined,
      max_clicks: max_clicks || undefined,
      clicks_count: 0,
      og_title: og_title || undefined,
      og_description: og_description || undefined,
      og_image_url: og_image_url || undefined,
      report_token: report_token,
      custom_ad:
        ad_mode === 'custom'
          ? {
              type: ad_type as any,
              media_url: ad_media_url,
              headline: ad_headline,
              timer_seconds: ad_timer_seconds,
              cta_text: ad_cta_text,
              cta_url: ad_cta_url,
              skippable: ad_skippable !== 0,
              auto_redirect: Boolean(ad_auto_redirect)
            }
          : undefined,
      is_active: true
    };
    await Promise.all([
      c.env.LINKS_KV.put(`link:${slug}`, JSON.stringify(kvRecord)),
      c.env.LINKS_KV.put(`link:${slug.toLowerCase()}`, JSON.stringify(kvRecord))
    ]);
  }

  const createdLink = await db.prepare('SELECT * FROM links WHERE id = ?').bind(newLinkId).first<ShortLink>();

  return c.json({
    success: true,
    message: 'Tautan singkat berhasil dibuat!',
    data: createdLink
  });
});

// GET /api/v1/links/:id - Get single link
linksRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const db = c.env.DB;

  const link = await db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first<ShortLink>();

  if (!link) {
    return c.json({ success: false, error: 'Tautan tidak ditemukan.' }, 404);
  }

  return c.json({ success: true, data: link });
});

// PUT /api/v1/links/:id - Update link
linksRouter.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const db = c.env.DB;

  const existing = await db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first<ShortLink>();

  if (!existing) {
    return c.json({ success: false, error: 'Tautan tidak ditemukan.' }, 404);
  }

  let target_url = (body.target_url || existing.target_url).trim();
  if (!/^https?:\/\//i.test(target_url)) {
    target_url = 'https://' + target_url;
  }
  const title = body.title !== undefined ? body.title : existing.title;
  const description = body.description !== undefined ? body.description : existing.description;
  const ad_mode = ['inherit', 'custom', 'disabled'].includes(body.ad_mode)
    ? body.ad_mode
    : existing.ad_mode;
  const ad_type = ['none', 'image', 'youtube'].includes(body.ad_type)
    ? body.ad_type
    : existing.ad_type;
  const ad_media_url = body.ad_media_url !== undefined ? body.ad_media_url.trim() : existing.ad_media_url;
  const ad_headline = body.ad_headline !== undefined ? body.ad_headline.trim() : existing.ad_headline;
  const ad_timer_seconds = Math.max(1, Math.min(60, Number(body.ad_timer_seconds) || existing.ad_timer_seconds || 5));
  const ad_cta_text = body.ad_cta_text !== undefined ? body.ad_cta_text.trim() : existing.ad_cta_text;
  const ad_cta_url = body.ad_cta_url !== undefined ? body.ad_cta_url.trim() : existing.ad_cta_url;
  const is_active = body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active;
  const qr_config = body.qr_config !== undefined ? JSON.stringify(body.qr_config) : existing.qr_config;

  const ad_skippable = body.ad_skippable !== undefined ? (body.ad_skippable ? 1 : 0) : (existing.ad_skippable !== undefined ? existing.ad_skippable : 1);
  const ad_auto_redirect = body.ad_auto_redirect !== undefined ? (body.ad_auto_redirect ? 1 : 0) : (existing.ad_auto_redirect || 0);

  let password_hash = existing.password_hash;
  if (body.password !== undefined) {
    const rawPwd = (body.password || '').trim();
    if (rawPwd) {
      const hashBuf = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(rawPwd + (c.env.JWT_SECRET || 'link_salt'))
      );
      password_hash = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      password_hash = null;
    }
  }

  const expires_at = body.expires_at !== undefined ? (body.expires_at ? new Date(body.expires_at).toISOString() : null) : existing.expires_at;
  const max_clicks = body.max_clicks !== undefined ? (Number(body.max_clicks) > 0 ? Number(body.max_clicks) : null) : existing.max_clicks;
  const og_title = body.og_title !== undefined ? (body.og_title.trim() || null) : existing.og_title;
  const og_description = body.og_description !== undefined ? (body.og_description.trim() || null) : existing.og_description;
  const og_image_url = body.og_image_url !== undefined ? (body.og_image_url.trim() || null) : existing.og_image_url;

  await db
    .prepare(`
      UPDATE links SET
        target_url = ?,
        title = ?,
        description = ?,
        ad_mode = ?,
        ad_type = ?,
        ad_media_url = ?,
        ad_headline = ?,
        ad_timer_seconds = ?,
        ad_cta_text = ?,
        ad_cta_url = ?,
        ad_skippable = ?,
        ad_auto_redirect = ?,
        password_hash = ?,
        expires_at = ?,
        max_clicks = ?,
        og_title = ?,
        og_description = ?,
        og_image_url = ?,
        is_active = ?,
        qr_config = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .bind(
      target_url,
      title,
      description,
      ad_mode,
      ad_type,
      ad_media_url,
      ad_headline,
      ad_timer_seconds,
      ad_cta_text,
      ad_cta_url,
      ad_skippable,
      ad_auto_redirect,
      password_hash,
      expires_at,
      max_clicks,
      og_title,
      og_description,
      og_image_url,
      is_active,
      qr_config,
      id,
      user.id
    )
    .run();

  // Update KV
  if (c.env.LINKS_KV) {
    const kvRecord: KVLinkRecord = {
      id: existing.id,
      user_id: user.id,
      target_url,
      title: title || undefined,
      ad_mode: ad_mode as any,
      ad_skippable: ad_skippable !== 0,
      ad_auto_redirect: Boolean(ad_auto_redirect),
      password_hash: password_hash || undefined,
      expires_at: expires_at || undefined,
      max_clicks: max_clicks || undefined,
      clicks_count: existing.clicks_count || 0,
      og_title: og_title || undefined,
      og_description: og_description || undefined,
      og_image_url: og_image_url || undefined,
      report_token: existing.report_token,
      custom_ad:
        ad_mode === 'custom'
          ? {
              type: ad_type as any,
              media_url: ad_media_url,
              headline: ad_headline,
              timer_seconds: ad_timer_seconds,
              cta_text: ad_cta_text,
              cta_url: ad_cta_url,
              skippable: ad_skippable !== 0,
              auto_redirect: Boolean(ad_auto_redirect)
            }
          : undefined,
      is_active: Boolean(is_active)
    };
    await Promise.all([
      c.env.LINKS_KV.put(`link:${existing.slug}`, JSON.stringify(kvRecord)),
      c.env.LINKS_KV.put(`link:${existing.slug.toLowerCase()}`, JSON.stringify(kvRecord))
    ]);
  }

  const updated = await db.prepare('SELECT * FROM links WHERE id = ?').bind(id).first<ShortLink>();
  return c.json({ success: true, message: 'Tautan berhasil diperbarui.', data: updated });
});

// PATCH /api/v1/links/:id/toggle-active - Instant 1-click status switch
linksRouter.patch('/:id/toggle-active', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const db = c.env.DB;

  const link = await db
    .prepare('SELECT id, slug, is_active FROM links WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first<{ id: string; slug: string; is_active: number }>();

  if (!link) {
    return c.json({ success: false, error: 'Tautan tidak ditemukan.' }, 404);
  }

  const newStatus = link.is_active ? 0 : 1;
  await db
    .prepare('UPDATE links SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(newStatus, id)
    .run();

  if (c.env.LINKS_KV) {
    const raw = await c.env.LINKS_KV.get(`link:${link.slug}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsed.is_active = Boolean(newStatus);
        await Promise.all([
          c.env.LINKS_KV.put(`link:${link.slug}`, JSON.stringify(parsed)),
          c.env.LINKS_KV.put(`link:${link.slug.toLowerCase()}`, JSON.stringify(parsed))
        ]);
      } catch {}
    }
  }

  return c.json({ success: true, is_active: Boolean(newStatus) });
});

// DELETE /api/v1/links/:id - Delete link
linksRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const db = c.env.DB;

  const link = await db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first<ShortLink>();

  if (!link) {
    return c.json({ success: false, error: 'Tautan tidak ditemukan.' }, 404);
  }

  // Delete from D1 (Cascades to daily clicks & analytics breakdown)
  await db.prepare('DELETE FROM links WHERE id = ? AND user_id = ?').bind(id, user.id).run();

  // Delete from KV
  if (c.env.LINKS_KV) {
    await Promise.all([
      c.env.LINKS_KV.delete(`link:${link.slug}`),
      c.env.LINKS_KV.delete(`link:${link.slug.toLowerCase()}`)
    ]);
  }

  return c.json({ success: true, message: 'Tautan berhasil dihapus.' });
});

function generateRandomSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}
