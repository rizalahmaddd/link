import { Hono } from 'hono';
import { Env, User } from '../types';
import { sendMagicLinkEmail } from '../services/email';
import { createSessionToken, getAuthenticatedUser, createSetCookieHeader, createClearCookieHeader } from '../services/auth';

export const authRouter = new Hono<{ Bindings: Env }>();

// Request Magic Link
authRouter.post('/magic-link', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return c.json({ success: false, error: 'Format email tidak valid.' }, 400);
    }

    // Rate limit check: only 1 email per minute per address
    const db = c.env.DB;
    const recentLink = await db
      .prepare(`
        SELECT created_at FROM magic_links 
        WHERE email = ? AND datetime(created_at, '+1 minute') > datetime('now')
        ORDER BY created_at DESC LIMIT 1
      `)
      .bind(email)
      .first<{ created_at: string }>();

    if (recentLink) {
      return c.json(
        { success: false, error: 'Mohon tunggu 1 menit sebelum meminta magic link baru.' },
        429
      );
    }

    // Generate random raw token
    const rawToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    
    // Hash token with SHA-256 for secure storage
    const tokenHashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(rawToken)
    );
    const tokenHash = Array.from(new Uint8Array(tokenHashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Save token in D1 (expires in 15 minutes)
    await db
      .prepare(`
        INSERT INTO magic_links (id, email, token_hash, expires_at)
        VALUES (?, ?, ?, datetime('now', '+15 minutes'))
      `)
      .bind(crypto.randomUUID(), email, tokenHash)
      .run();

    // Build verify URL
    const appUrl = c.env.APP_URL || new URL(c.req.url).origin;
    const magicLinkUrl = `${appUrl}/auth/verify?token=${rawToken}`;

    // Send email via Resend
    const emailResult = await sendMagicLinkEmail({
      to: email,
      magicLinkUrl,
      apiKey: c.env.RESEND_API_KEY,
      fromEmail: c.env.RESEND_FROM_EMAIL
    });

    return c.json({
      success: true,
      message: 'Magic link telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam.',
      simulated: emailResult.simulated,
      devMagicLinkUrl: emailResult.simulated ? magicLinkUrl : undefined
    });
  } catch (err: any) {
    console.error('Magic link request error:', err);
    return c.json({ success: false, error: err?.message || 'Gagal memproses magic link.' }, 500);
  }
});

// Verify Magic Link
authRouter.get('/verify', async (c) => {
  const wantsJson = c.req.query('format') === 'json' || c.req.header('accept')?.includes('application/json');

  try {
    const rawToken = c.req.query('token');
    if (!rawToken) {
      if (wantsJson) {
        return c.json({ success: false, authenticated: false, error: 'Token tidak ditemukan.' }, 400);
      }
      return c.redirect('/?error=Token+tidak+ditemukan');
    }

    // Hash incoming token to match database
    const tokenHashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(rawToken)
    );
    const tokenHash = Array.from(new Uint8Array(tokenHashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const db = c.env.DB;

    // Find magic link
    const magicRecord = await db
      .prepare(`
        SELECT * FROM magic_links
        WHERE token_hash = ? AND consumed_at IS NULL AND datetime(expires_at) > datetime('now')
      `)
      .bind(tokenHash)
      .first<{ id: string; email: string }>();

    if (!magicRecord) {
      if (wantsJson) {
        return c.json({ success: false, authenticated: false, error: 'Tautan masuk sudah kedaluwarsa atau pernah digunakan.' }, 400);
      }
      return c.redirect('/?error=Tautan+masuk+sudah+kedaluwarsa+atau+pernah+digunakan');
    }

    // Mark as consumed
    await db
      .prepare(`UPDATE magic_links SET consumed_at = datetime('now') WHERE id = ?`)
      .bind(magicRecord.id)
      .run();

    // Find or create user
    let user = await db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .bind(magicRecord.email)
      .first<User>();

    if (!user) {
      const newUserId = crypto.randomUUID();
      await db
        .prepare(`
          INSERT INTO users (id, email, global_ad_enabled, global_ad_type)
          VALUES (?, ?, 0, 'none')
        `)
        .bind(newUserId, magicRecord.email)
        .run();

      user = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(newUserId).first<User>();
    }

    if (!user) {
      if (wantsJson) {
        return c.json({ success: false, authenticated: false, error: 'Gagal membuat sesi pengguna.' }, 500);
      }
      return c.redirect('/?error=Gagal+membuat+sesi+pengguna');
    }

    // Generate JWT Session Token
    const sessionToken = await createSessionToken({ id: user.id, email: user.email }, c.env);

    const isSecure = c.req.url.startsWith('https://') || c.env.ENVIRONMENT === 'production';
    const cookieHeader = createSetCookieHeader(sessionToken, isSecure);

    // If client requested JSON (e.g. from React SPA or PWA client)
    if (wantsJson) {
      return c.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          global_ad_enabled: Boolean(user.global_ad_enabled),
          global_ad_type: user.global_ad_type,
          global_ad_media_url: user.global_ad_media_url,
          global_ad_headline: user.global_ad_headline,
          global_ad_timer_seconds: user.global_ad_timer_seconds || 5,
          global_ad_cta_text: user.global_ad_cta_text,
          global_ad_cta_url: user.global_ad_cta_url,
          created_at: user.created_at
        }
      }, 200, {
        'Set-Cookie': cookieHeader
      });
    }

    // Return explicit HTTP 302 response with Location and Set-Cookie for regular navigations
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': cookieHeader
      }
    });
  } catch (err: any) {
    console.error('Verify error:', err);
    if (wantsJson) {
      return c.json({ success: false, authenticated: false, error: err?.message || 'Terjadi kesalahan saat verifikasi.' }, 500);
    }
    return c.redirect('/?error=Terjadi+kesalahan+saat+verifikasi');
  }
});

// Check current user
authRouter.get('/me', async (c) => {
  const user = await getAuthenticatedUser(c.req.raw, c.env);
  if (!user) {
    return c.json({ authenticated: false, user: null }, 401);
  }
  return c.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      global_ad_enabled: Boolean(user.global_ad_enabled),
      global_ad_type: user.global_ad_type,
      global_ad_media_url: user.global_ad_media_url,
      global_ad_headline: user.global_ad_headline,
      global_ad_timer_seconds: user.global_ad_timer_seconds || 5,
      global_ad_cta_text: user.global_ad_cta_text,
      global_ad_cta_url: user.global_ad_cta_url,
      created_at: user.created_at
    }
  });
});

// Logout
authRouter.post('/logout', (c) => {
  c.header('Set-Cookie', createClearCookieHeader());
  return c.json({ success: true, message: 'Berhasil keluar.' });
});
