import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSpotifyAuthEnv,
  exchangeCodeForToken,
} from "@/lib/spotify-auth";

/** Always send user to 127.0.0.1 so cookie and host match (avoid localhost). */
function canonicalOrigin(req: Request): string {
  const url = new URL(req.url);
  const port = url.port || "3000";
  return `http://127.0.0.1:${port}`;
}

export async function GET(req: Request) {
  const origin = canonicalOrigin(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("spotify_verifier")?.value;
  if (!verifier) {
    return NextResponse.redirect(`${origin}/?error=no_verifier`);
  }

  const { clientId, clientSecret } = getSpotifyAuthEnv();
  const { access_token } = await exchangeCodeForToken(
    clientId,
    clientSecret,
    code,
    verifier
  );

  const res = NextResponse.redirect(origin + "/");
  res.cookies.set("spotify_token", access_token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });
  res.cookies.delete("spotify_verifier");
  return res;
}
