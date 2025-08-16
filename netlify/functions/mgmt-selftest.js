// netlify/functions/mgmt-selftest.js
export async function handler() {
  const { AUTH0_DOMAIN, AUTH0_M2M_CLIENT_ID, AUTH0_M2M_CLIENT_SECRET } = process.env;

  const report = {
    env: {
      AUTH0_DOMAIN: !!AUTH0_DOMAIN,
      AUTH0_M2M_CLIENT_ID: !!AUTH0_M2M_CLIENT_ID,
      AUTH0_M2M_CLIENT_SECRET: !!AUTH0_M2M_CLIENT_SECRET
    },
    token: null,
    users_probe: null
  };

  // Fail fast: env mancanti
  if (!AUTH0_DOMAIN || !AUTH0_M2M_CLIENT_ID || !AUTH0_M2M_CLIENT_SECRET) {
    return json(500, {
      ok: false,
      step: "env",
      detail: "Missing one or more Netlify env vars",
      report
    });
  }

  try {
    // Step 1: token M2M
    const tRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
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

    const tText = await tRes.text();
    let tJson; try { tJson = JSON.parse(tText); } catch { tJson = { raw: tText }; }

    report.token = {
      status: tRes.status,
      ok: tRes.ok,
      has_access_token: !!tJson?.access_token,
      scope: tJson?.scope || null,
      error: tJson?.error || null,
      error_description: tJson?.error_description || null
    };

    if (!tRes.ok || !tJson.access_token) {
      return json(500, { ok: false, step: "token", detail: "Cannot obtain M2M token", report });
    }

    const access_token = tJson.access_token;

    // Step 2: probe users list (per_page=1)
    const uRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users?per_page=1&page=0&include_totals=false`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const uText = await uRes.text();
    let uJson; try { uJson = JSON.parse(uText); } catch { uJson = { raw: uText }; }

    report.users_probe = {
      status: uRes.status,
      ok: uRes.ok,
      sample_type: Array.isArray(uJson) ? "array" : typeof uJson,
      sample_length: Array.isArray(uJson) ? uJson.length : null
    };

    if (!uRes.ok) {
      return json(500, { ok: false, step: "users", detail: "Management API call failed", report });
    }

    return json(200, { ok: true, step: "done", report });
  } catch (e) {
    return json(500, { ok: false, step: "exception", detail: String(e), report });
  }
}

function json(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body, null, 2)
  };
}
