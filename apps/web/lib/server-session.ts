import { cookies } from 'next/headers';
import { Pool } from 'pg';
import * as oidc from 'openid-client';
import { authConfig, cognitoClient } from './cognito';
import { hashId, seal, sessionId, unseal } from './session-crypto';

const globalDb = globalThis as typeof globalThis & { ehrSessionPool?: Pool };
const pool = globalDb.ehrSessionPool ?? new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://ehr:ehrpass@localhost:5432/ehr',
});
globalDb.ehrSessionPool = pool;

export const SESSION_COOKIE = 'ehr_session';
export const LOGIN_COOKIE = 'ehr_login';
export const SESSION_SECONDS = 8 * 60 * 60;
export function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: authConfig().origin.startsWith('https://'), sameSite: 'lax' as const,
    path: '/', maxAge };
}

export interface LoginTransaction { state: string; nonce: string; verifier: string }
export interface LoginSession { accessToken: string; refreshToken?: string; expiresAt: number; sub: string }

export async function createSession(kind: 'login' | 'session', payload: LoginTransaction | LoginSession, seconds: number) {
  const id = sessionId();
  await pool.query('DELETE FROM web_sessions WHERE expires_at <= NOW()');
  await pool.query('INSERT INTO web_sessions (id, kind, payload, expires_at) VALUES ($1, $2, $3, $4)',
    [hashId(id), kind, seal(payload), new Date(Date.now() + seconds * 1000)]);
  return id;
}

export async function deleteSession(id: string | undefined) {
  if (id) await pool.query('DELETE FROM web_sessions WHERE id = $1', [hashId(id)]);
}

export async function consumeLogin(id: string): Promise<LoginTransaction | null> {
  const result = await pool.query("DELETE FROM web_sessions WHERE id = $1 AND kind = 'login' AND expires_at > NOW() RETURNING payload", [hashId(id)]);
  return result.rows[0] ? unseal<LoginTransaction>(result.rows[0].payload) : null;
}

export async function accessToken(): Promise<string | null> {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = await pool.connect();
  try {
    // Serialize refreshes from parallel dashboard/API requests.
    await db.query('BEGIN');
    const result = await db.query("SELECT payload FROM web_sessions WHERE id = $1 AND kind = 'session' AND expires_at > NOW() FOR UPDATE", [hashId(id)]);
    if (!result.rows[0]) { await db.query('COMMIT'); return null; }
    const session = unseal<LoginSession>(result.rows[0].payload);
    if (session.expiresAt <= Date.now() + 30_000) {
      if (!session.refreshToken) {
        await db.query('DELETE FROM web_sessions WHERE id = $1', [hashId(id)]);
        await db.query('COMMIT');
        return null;
      }
      try {
        const tokens = await oidc.refreshTokenGrant(await cognitoClient(), session.refreshToken);
        session.accessToken = tokens.access_token;
        session.refreshToken = tokens.refresh_token ?? session.refreshToken;
        session.expiresAt = Date.now() + (tokens.expires_in ?? 300) * 1000;
        await db.query('UPDATE web_sessions SET payload = $2 WHERE id = $1', [hashId(id), seal(session)]);
      } catch {
        await db.query('DELETE FROM web_sessions WHERE id = $1', [hashId(id)]);
        await db.query('COMMIT');
        return null;
      }
    }
    await db.query('COMMIT');
    return session.accessToken;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { db.release(); }
}

export async function ehrFetch(path: string, token: string) {
  const base = process.env.API_URL ?? 'http://localhost:4000/api';
  return fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
}

export function sameOrigin(request: Request) {
  // CSRF rejection must also work before Cognito has been fully configured.
  return request.headers.get('origin') === new URL(process.env.APP_URL ?? 'http://localhost:3000').origin;
}
