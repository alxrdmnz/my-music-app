import { NextResponse } from "next/server";
import {
  getSpotifyAuthEnv,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
} from "@/lib/spotify-auth";

export async function GET() {
  const { clientId } = getSpotifyAuthEnv();
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const url = buildAuthorizeUrl(clientId, challenge);
  const res = NextResponse.redirect(url);
  res.cookies.set("spotify_verifier", verifier, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 min
    path: "/",
  });
  return res;
}
