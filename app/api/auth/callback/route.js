import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'OAuth not configured (set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)' }, { status: 500 });
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const tokenJson = await tokenRes.json();
  if (tokenJson.error) {
    return NextResponse.json({ error: 'Token exchange failed', details: tokenJson }, { status: 500 });
  }

  const accessToken = tokenJson.access_token;

  // Simple success page showing token (in a real app you'd set a secure cookie)
  const html = `<!doctype html><html><body><h2>Sign in successful</h2><p>Access token: <code>${accessToken}</code></p><p>Close this window and paste the token into your profile settings.</p></body></html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
