import { NextResponse } from 'next/server';

export async function GET(request) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID not configured' }, { status: 500 });
  }

  const url = new URL('https://github.com/login/oauth/authorize');
  const origin = request.nextUrl ? request.nextUrl.origin : '';
  url.searchParams.set('client_id', GITHUB_CLIENT_ID);
  url.searchParams.set('scope', 'read:user repo');
  url.searchParams.set('redirect_uri', `${origin}/api/auth/callback`);
  url.searchParams.set('allow_signup', 'true');

  return NextResponse.redirect(url.toString());
}
