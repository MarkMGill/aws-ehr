import { NextResponse } from 'next/server';
import { accessToken, ehrFetch } from '@/lib/server-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const token = await accessToken();
    if (!token) return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
    const response = await ehrFetch('/me', token);
    return NextResponse.json(await response.json(), { status: response.status, headers });
  } catch {
    return NextResponse.json({ message: 'Session service unavailable.' }, { status: 503, headers });
  }
}
