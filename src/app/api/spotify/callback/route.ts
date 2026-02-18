import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSpotifyAuthEnv,
  exchangeCodeForToken,
  getAppOrigin,
} from "@/lib/spotify-auth";

export async function GET(req: Request) {
  const origin = getAppOrigin(req);
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
  const isProduction =
    process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";
  res.cookies.set("spotify_token", access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });
  res.cookies.delete("spotify_verifier");
  return res;
}
