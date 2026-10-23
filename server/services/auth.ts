import { SignJWT, jwtVerify } from 'jose';
import { Env, JWTPayload, User } from '../types';

const COOKIE_NAME = 'link_session';
const DEFAULT_SECRET = 'link_secure_hmac_secret_2026_super_key';

function getSecret(env: Env): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET || DEFAULT_SECRET);
}

export async function createSessionToken(user: { id: string; email: string }, env: Env): Promise<string> {
  const secret = getSecret(env);
  return await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifySessionToken(token: string, env: Env): Promise<JWTPayload | null> {
  try {
    const secret = getSecret(env);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export async function getAuthenticatedUser(req: Request, env: Env): Promise<User | null> {
  const cookieHeader = req.headers.get('Cookie');
  let token = parseCookie(cookieHeader, COOKIE_NAME);

  // Also support Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const payload = await verifySessionToken(token, env);
  if (!payload || !payload.userId) return null;

  const db = env.DB;
  if (!db) return null;

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first<User>();
  return user || null;
}

export function createSetCookieHeader(token: string, isSecure = true): string {
  // Max-age: 30 days = 2592000 seconds
  const secure = isSecure ? 'Secure; ' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=2592000`;
}

export function createClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
