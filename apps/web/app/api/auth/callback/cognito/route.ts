import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as oidc from 'openid-client';
import { authConfig, cognitoClient } from '@/lib/cognito';
import { consumeLogin, cookieOptions, createSession, deleteSession, ehrFetch, LOGIN_COOKIE, SESSION_COOKIE, SESSION_SECONDS } from '@/lib/server-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = process.env.APP_URL ?? 'http://localhost:3000';
  const failure = NextResponse.redirect(new URL('/login?error=signin', origin));
  failure.cookies.delete(LOGIN_COOKIE);
  failure.headers.set('Cache-Control', 'no-store');
  try {
    const id = cookies().get(LOGIN_COOKIE)?.value;
    const transaction = id ? await consumeLogin(id) : null;
    if (!transaction) return failure;
    const config = authConfig();
    // Build from the configured origin, never a request Host header.
    const url = new URL(config.callback);
    url.search = new URL(request.url).search;
    const tokens = await oidc.authorizationCodeGrant(await cognitoClient(), url, {
      expectedState: transaction.state, expectedNonce: transaction.nonce,
      pkceCodeVerifier: transaction.verifier, idTokenExpected: true,
    });
    const claims = tokens.claims();
    if (!claims?.sub) return failure;
    const profile = await ehrFetch('/me', tokens.access_token);
    if (!profile.ok) {
      failure.headers.set('Location', new URL(`/login?error=${profile.status === 403 ? 'unlinked' : 'signin'}`, origin).href);
      return failure;
    }
    await deleteSession(cookies().get(SESSION_COOKIE)?.value);
    const sessionId = await createSession('session', {
      accessToken: tokens.access_token, refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in ?? 300) * 1000, sub: claims.sub,
    }, SESSION_SECONDS);
    const response = NextResponse.redirect(new URL('/dashboard', origin));
    response.cookies.delete(LOGIN_COOKIE);
    response.cookies.set(SESSION_COOKIE, sessionId, cookieOptions(SESSION_SECONDS));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch { return failure; }
}
