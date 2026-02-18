import { createHash, randomBytes } from "node:crypto";

const DEFAULT_REDIRECT_URI = "http://127.0.0.1:3000/api/spotify/callback";
/** Fallback when Vercel system env vars are not exposed (Settings → Environment Variables → expose system vars). */
const PRODUCTION_REDIRECT_URI = "https://tempoflowmusic.vercel.app/api/spotify/callback";
const PRODUCTION_ORIGIN = "https://tempoflowmusic.vercel.app";

/** Redirect URI for Spotify OAuth. Must match Spotify Dashboard → Redirect URIs exactly (no trailing slash). */
function getRedirectUri(): string {
  const fromEnv = (process.env.SPOTIFY_REDIRECT_URI ?? "").trim();
  if (fromEnv && !fromEnv.includes("localhost")) return fromEnv;
  // Production on Vercel (requires "Automatically expose System Environment Variables" in project settings)
  const vercelUrl = (process.env.VERCEL_URL ?? "").trim();
  if (vercelUrl) return `https://${vercelUrl}/api/spotify/callback`;
  const productionUrl = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim();
  if (productionUrl) return `https://${productionUrl}/api/spotify/callback`;
  // Fallback when running on Vercel but system vars not exposed
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production") {
    return PRODUCTION_REDIRECT_URI;
  }
  // Local: use 127.0.0.1 so callback and PKCE cookie share the same host
  return DEFAULT_REDIRECT_URI;
}

/** Origin to redirect to after auth/logout. Production: https host; local: http://127.0.0.1:port */
export function getAppOrigin(req?: Request): string {
  const vercelUrl = (process.env.VERCEL_URL ?? "").trim();
  if (vercelUrl) return `https://${vercelUrl}`;
  const productionUrl = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim();
  if (productionUrl) return `https://${productionUrl}`;
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production") {
    return PRODUCTION_ORIGIN;
  }
  if (req) {
    const url = new URL(req.url);
    const port = url.port || "3000";
    return `http://127.0.0.1:${port}`;
  }
  return "http://127.0.0.1:3000";
}

const SCOPES =
  "user-read-private user-read-email playlist-modify-private playlist-modify-public playlist-read-private";

export function getSpotifyAuthEnv() {
  const clientId = (process.env.SPOTIFY_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET ?? "").trim();
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env.local");
  }
  return { clientId, clientSecret };
}

/** Generate PKCE code_verifier (43–128 chars). */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** Generate PKCE code_challenge (S256) from verifier. */
export function generateCodeChallenge(verifier: string): string {
  const digest = createHash("sha256").update(verifier, "utf8").digest();
  return digest.toString("base64url");
}

export function buildAuthorizeUrl(clientId: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
  codeVerifier: string
): Promise<{ access_token: string }> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data;
}

export { getRedirectUri };
