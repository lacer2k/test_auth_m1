import fetch from "node-fetch";

export async function handler(event) {
  const { user_id } = event.queryStringParameters;

  // 1. Ottieni M2M token da Auth0
  const tokenRes = await fetch("https://dev-ppsnetwf.us.auth0.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AUTH0_M2M_CLIENT_ID,
      client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
      audience: "https://dev-ppsnetwf.us.auth0.com/api/v2/",
      grant_type: "client_credentials"
    })
  });
  const { access_token } = await tokenRes.json();

  // 2. Chiamata Management API
  const userRes = await fetch(
    `https://dev-ppsnetwf.us.auth0.com/api/v2/users/${encodeURIComponent(user_id)}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const user = await userRes.json();

  return {
    statusCode: 200,
    body: JSON.stringify(user, null, 2)
  };
}