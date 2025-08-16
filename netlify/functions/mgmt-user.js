export async function handler(event) {
  const { AUTH0_DOMAIN } = process.env;
  const AUTH0_M2M_CLIENT_ID =
    process.env.AUTH0_M2M_CLIENT_ID || process.env.AUTH0_MGMT_CLIENT_ID;
  const AUTH0_M2M_CLIENT_SECRET =
    process.env.AUTH0_M2M_CLIENT_SECRET || process.env.AUTH0_MGMT_CLIENT_SECRET;

  const user_id = event.queryStringParameters?.user_id;

  if (!user_id) return respond(400, { error: "user_id_required" });
  if (!AUTH0_DOMAIN || !AUTH0_M2M_CLIENT_ID || !AUTH0_M2M_CLIENT_SECRET) {
    return respond(500, { error: "missing_env", detail: "Set AUTH0_DOMAIN and M2M credentials in Netlify env." });
  }

  try {
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
    if (!tokenRes.ok) return respond(500, { error: "token_error", detail: await tokenRes.text() });
    const { access_token } = await tokenRes.json();

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