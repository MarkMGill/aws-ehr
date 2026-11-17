import { NextResponse } from 'next/server';
import { accessToken, ehrFetch } from '@/lib/server-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const allowed = new Set(['dashboard', 'patients', 'clinical-notes', 'prescriptions', 'billing', 'documents', 'portal', 'me']);

export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  const headers = { 'Cache-Control': 'no-store' };
  if (params.path.length !== 1 || !allowed.has(params.path[0])) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404, headers });
  }
  try {
    const token = await accessToken();
    if (!token) return NextResponse.json({ message: 'Authentication required.' }, { status: 401, headers });
    const response = await ehrFetch(`/${params.path[0]}`, token);
    return NextResponse.json(await response.json(), { status: response.status, headers });
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503, headers });
  }
}
