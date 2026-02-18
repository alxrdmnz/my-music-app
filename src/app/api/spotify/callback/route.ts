import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSpotifyAuthEnv,
  exchangeCodeForToken,
} from "@/lib/spotify-auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, req.url)
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("spotify_verifier")?.value;
  if (!verifier) {
    return NextResponse.redirect(new URL("/?error=no_verifier", req.url));
  }

  const { clientId, clientSecret } = getSpotifyAuthEnv();
  const { access_token } = await exchangeCodeForToken(
    clientId,
    clientSecret,
    code,
    verifier
  );

  const redirectUrl = new URL("/", req.url);
  const res = NextResponse.redirect(redirectUrl);
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
