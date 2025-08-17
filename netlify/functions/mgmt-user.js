// netlify/functions/mgmt-user.js

// Cache in memoria per istanza (rimane finché la function resta "calda")
let tokenCache = {
  access_token: null,
  expires_at: 0 // ms epoch
};

async function getMgmtToken({ domain, clientId, clientSecret, forceRefresh = false }) {
  const now = Date.now();

  // Riuso se non forzato e non scaduto (con 60s di margine)
  if (!forceRefresh && tokenCache.access_token && now < tokenCache.expires_at - 60_000) {
    return tokenCache.access_token;
  }

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      scope: "read:users"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token error (${res.status}): ${text}`);
  }

  const { access_token, expires_in } = await res.json();
  tokenCache.access_token = access_token;
  tokenCache.expires_at = now + expires_in * 1000;
  return access_token;
}

function json(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

// Helper: ritorna true se la risposta indica token scaduto/invalid
async function isExpiredTokenResponse(res) {
  if (res.status !== 401 && res.status !== 403) return false;
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    const err = (data.error || data.errorCode || "").toString().toLowerCase();
    const desc = (data.error_description || data.message || "").toString().toLowerCase();
    return err.includes("invalid_token") || desc.includes("expired") || desc.includes("invalid token");
  } catch {
    return text.toLowerCase().includes("invalid_token") || text.toLowerCase().includes("expired");
  }
}

export async function handler(event) {
  const { AUTH0_DOMAIN } = process.env;
  const AUTH0_M2M_CLIENT_ID =
    process.env.AUTH0_M2M_CLIENT_ID || process.env.AUTH0_MGMT_CLIENT_ID;
  const AUTH0_M2M_CLIENT_SECRET =
    process.env.AUTH0_M2M_CLIENT_SECRET || process.env.AUTH0_MGMT_CLIENT_SECRET;

  const user_id = event.queryStringParameters?.user_id;

  if (!user_id) return json(400, { error: "user_id_required" });
  if (!AUTH0_DOMAIN || !AUTH0_M2M_CLIENT_ID || !AUTH0_M2M_CLIENT_SECRET) {
    return json(500, {
      error: "missing_env",
      detail: "Set AUTH0_DOMAIN and M2M credentials (AUTH0_M2M_CLIENT_ID/_SECRET) in Netlify env."
    });
  }

  try {
    // 1) token (on-demand, con cache)
    let access_token = await getMgmtToken({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_M2M_CLIENT_ID,
      clientSecret: AUTH0_M2M_CLIENT_SECRET
    });

    // 2) prima chiamata Management API
    let res = await fetch(
      `https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user_id)}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    // 3) fallback: se token scaduto/invalid → forza refresh e riprova una volta
    if (await isExpiredTokenResponse(res)) {
      access_token = await getMgmtToken({
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_M2M_CLIENT_ID,
        clientSecret: AUTH0_M2M_CLIENT_SECRET,
        forceRefresh: true
      });

      res = await fetch(
        `https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user_id)}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
    }

    // 4) ritorna la risposta della Management API così com'è
    const bodyText = await res.text();
    return {
      statusCode: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
      body: bodyText
    };
  } catch (e) {
    return json(500, { error: "proxy_error", detail: String(e) });
  }
}