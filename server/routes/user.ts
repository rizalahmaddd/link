import { Hono } from 'hono';
import { AppContext, UserKVAdProfile } from '../types';
import { getAuthenticatedUser } from '../services/auth';

export const userRouter = new Hono<AppContext>();

// Middleware auth check
userRouter.use('*', async (c, next) => {
  const user = await getAuthenticatedUser(c.req.raw, c.env);
  if (!user) {
    return c.json({ success: false, error: 'Silakan login terlebih dahulu.' }, 401);
  }
  c.set('user', user);
  await next();
});

// GET Global Ad Settings
userRouter.get('/ad-settings', async (c) => {
  const user = c.get('user');
  return c.json({
    success: true,
    data: {
      global_ad_enabled: Boolean(user.global_ad_enabled),
      global_ad_type: user.global_ad_type || 'none',
      global_ad_media_url: user.global_ad_media_url || '',
      global_ad_headline: user.global_ad_headline || '',
      global_ad_timer_seconds: user.global_ad_timer_seconds || 5,
      global_ad_cta_text: user.global_ad_cta_text || '',
      global_ad_cta_url: user.global_ad_cta_url || '',
      global_ad_skippable: user.global_ad_skippable !== 0,
      global_ad_auto_redirect: Boolean(user.global_ad_auto_redirect)
    }
  });
});

// PUT Update Global Ad Settings
userRouter.put('/ad-settings', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const global_ad_enabled = body.global_ad_enabled ? 1 : 0;
  const global_ad_type = ['image', 'youtube'].includes(body.global_ad_type)
    ? body.global_ad_type
    : 'none';
  const global_ad_media_url = (body.global_ad_media_url || '').trim();
  const global_ad_headline = (body.global_ad_headline || '').trim();
  const global_ad_timer_seconds = Math.max(1, Math.min(60, Number(body.global_ad_timer_seconds) || 5));
  const global_ad_cta_text = (body.global_ad_cta_text || '').trim();
  const global_ad_cta_url = (body.global_ad_cta_url || '').trim();
  const global_ad_skippable = body.global_ad_skippable !== false ? 1 : 0;
  const global_ad_auto_redirect = body.global_ad_auto_redirect ? 1 : 0;

  // Validate URL if enabled
  if (global_ad_enabled && global_ad_type !== 'none' && !global_ad_media_url) {
    return c.json(
      { success: false, error: 'URL link foto atau link video YouTube wajib diisi jika iklan diaktifkan.' },
      400
    );
  }

  const db = c.env.DB;
  await db
    .prepare(`
      UPDATE users SET
        global_ad_enabled = ?,
        global_ad_type = ?,
        global_ad_media_url = ?,
        global_ad_headline = ?,
        global_ad_timer_seconds = ?,
        global_ad_cta_text = ?,
        global_ad_cta_url = ?,
        global_ad_skippable = ?,
        global_ad_auto_redirect = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      global_ad_enabled,
      global_ad_type,
      global_ad_media_url,
      global_ad_headline,
      global_ad_timer_seconds,
      global_ad_cta_text,
      global_ad_cta_url,
      global_ad_skippable,
      global_ad_auto_redirect,
      user.id
    )
    .run();

  // Sync with Cloudflare KV for sub-15ms edge lookup
  if (c.env.LINKS_KV) {
    const kvProfile: UserKVAdProfile = {
      global_enabled: Boolean(global_ad_enabled),
      type: global_ad_type as any,
      media_url: global_ad_media_url,
      headline: global_ad_headline,
      timer_seconds: global_ad_timer_seconds,
      cta_text: global_ad_cta_text,
      cta_url: global_ad_cta_url,
      skippable: global_ad_skippable !== 0,
      auto_redirect: Boolean(global_ad_auto_redirect)
    };
    await c.env.LINKS_KV.put(`user_ad:${user.id}`, JSON.stringify(kvProfile));
  }

  return c.json({
    success: true,
    message: 'Pengaturan iklan global berhasil diperbarui untuk seluruh tautan Anda.'
  });
});
