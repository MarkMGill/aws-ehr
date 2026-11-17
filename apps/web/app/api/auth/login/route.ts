import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as oidc from 'openid-client';
import { authConfig, cognitoClient } from '@/lib/cognito';
import { cookieOptions, createSession, deleteSession, LOGIN_COOKIE } from '@/lib/server-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await cognitoClient();
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const verifier = oidc.randomPKCECodeVerifier();
    const url = oidc.buildAuthorizationUrl(client, {
      redirect_uri: authConfig().callback, response_type: 'code', scope: 'openid email profile',
      state, nonce, code_challenge: await oidc.calculatePKCECodeChallenge(verifier), code_challenge_method: 'S256',
    });
    await deleteSession(cookies().get(LOGIN_COOKIE)?.value);
    const id = await createSession('login', { state, nonce, verifier }, 600);
    const response = NextResponse.redirect(url);
    response.cookies.set(LOGIN_COOKIE, id, cookieOptions(600));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    // Do not log OIDC errors, which can contain secrets or authorization codes.
    return NextResponse.json({ message: 'Sign-in unavailable. Check Cognito environment settings, network access, and run the auth database migration.' }, { status: 503 });
  }
}
