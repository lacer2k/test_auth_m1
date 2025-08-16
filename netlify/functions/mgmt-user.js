// netlify/functions/mgmt-user.js

export async function handler(event) {
  const { AUTH0_DOMAIN, AUTH0_M2M_CLIENT_ID, AUTH0_M2M_CLIENT_SECRET } = process.env;
  const user_id = event.queryStringParameters?.user_id;

  if (!user_id) {
    return respond(400, { error: "user_id_required" });
  }

  try {
    // 1. Ottieni token M2M
    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: AUTH0_M2M_CLIENT_ID,
        client_secret: AUTH0_M2M_CLIENT_SECRET,
        audience: `https://${AUTH0_DOMAIN}/api/v2/`,
        scope: "read:users"
      })
    });

    if (!tokenRes.ok) {
      return respond(500, { error: "token_error", detail: await tokenRes.text() });
    }
    const { access_token } = await tokenRes.json();

    // 2. Chiama Management API
    const mgmtRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user_id)}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    return {
      statusCode: mgmtRes.status,
      headers: { "Content-Type": "application/json" },
      body: await mgmtRes.text()
    };
  } catch (e) {
    return respond(500, { error: "proxy_error", detail: String(e) });
  }
}

function respond(status, obj) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
