const AUTH0_DOMAIN = "dev-ppsnetwf.us.auth0.com";
const AUTH0_ISS = `https://${AUTH0_DOMAIN}/`;
const AUTH0_AUD = "v8SikCjLbbH0ioHuoKSkADBHcofOOWHj";

export default async (req: Request) => {
  const idToken = getIdToken(req);
  if (!idToken) return redirectToLogin(req);

  try {
    const { header, payload, signature, signingInput } = decode(idToken);
    if (payload.iss !== AUTH0_ISS || !audOK(payload.aud)) throw new Error("bad iss/aud");
    const key = await getJwkKey(header.kid);
    const ok = await verify(signingInput, signature, key);
    if (!ok) throw new Error("bad sig");
    // ✅ Auth OK → let Netlify serve the static asset
    return; // fall through, asset is served
  } catch {
    return redirectToLogin(req);
  }
};

function getIdToken(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const m = /(?:^|;\s*)id_token=([^;]+)/.exec(cookie);
  if (m) return decodeURIComponent(m[1]);
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

function redirectToLogin(req: Request) {
  const url = new URL(req.url);
  const login = new URL(`${AUTH0_ISS}authorize`);
  login.searchParams.set("response_type", "code");
  login.searchParams.set("client_id", AUTH0_AUD);
  login.searchParams.set("redirect_uri", `${url.origin}/`);
  login.searchParams.set("scope", "openid profile email");
  login.searchParams.set("app_return", url.href);
  return new Response(null, { status: 302, headers: { location: login.toString() } });
}

function decode(jwt: string) {
  const [h, p, s] = jwt.split(".");
  const header = JSON.parse(atob(h.replace(/-/g, "+").replace(/_/g, "/")));
  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  const signature = Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const signingInput = new TextEncoder().encode(`${h}.${p}`);
  return { header, payload, signature, signingInput };
}

function audOK(aud: string | string[]) {
  return Array.isArray(aud) ? aud.includes(AUTH0_AUD) : aud === AUTH0_AUD;
}

let jwks: any = null;
async function getJwkKey(kid: string): Promise<CryptoKey> {
  if (!jwks) jwks = await (await fetch(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)).json();
  const jwk = jwks.keys.find((k: any) => k.kid === kid);
  if (!jwk) throw new Error("no jwk");
  return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
}

async function verify(signingInput: Uint8Array, sig: Uint8Array, key: CryptoKey) {
  return crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, sig, signingInput);
}
