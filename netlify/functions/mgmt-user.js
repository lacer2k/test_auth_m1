// netlify/functions/mgmt-user.js
export default async (req, context) => {
  const { AUTH0_DOMAIN, AUTH0_MGMT_CLIENT_ID, AUTH0_MGMT_CLIENT_SECRET } = process.env;
  if (!AUTH0_DOMAIN || !AUTH0_MGMT_CLIENT_ID || !AUTH0_MGMT_CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: 'Missing Auth0 env vars' }), { status: 500 });
  }

  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');
  if (!user_id) {
    return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
  }

  try {
    // 1) Get M2M token for Management API
    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: AUTH0_MGMT_CLIENT_ID,
        client_secret: AUTH0_MGMT_CLIENT_SECRET,
        audience: `https://${AUTH0_DOMAIN}/api/v2/`
      })
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new Response(JSON.stringify({ error: 'token_error', detail: err }), { status: 500 });
    }
    const { access_token } = await tokenRes.json();

    // 2) Call Management API with the token
    const mgmtRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user_id)}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const body = await mgmtRes.text();
    return new Response(body, {
      status: mgmtRes.status,
      headers: { 'content-type': mgmtRes.headers.get('content-type') || 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'proxy_error', detail: String(e) }), { status: 500 });
  }
};
