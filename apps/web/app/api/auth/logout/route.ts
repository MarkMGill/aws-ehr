import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/cognito';
import { deleteSession, LOGIN_COOKIE, sameOrigin, SESSION_COOKIE } from '@/lib/server-session';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Invalid request origin.' }, { status: 403 });
  try {
    await deleteSession(cookies().get(SESSION_COOKIE)?.value);
    await deleteSession(cookies().get(LOGIN_COOKIE)?.value);
    const config = authConfig();
    const url = new URL('/logout', config.domain);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('logout_uri', config.origin);
    const response = NextResponse.redirect(url, 303);
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(LOGIN_COOKIE);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return NextResponse.json({ message: 'Logout unavailable. Please retry.' }, { status: 503 });
  }
}
