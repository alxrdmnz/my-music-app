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

  const isProduction =
    process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";
  // Return 200 + HTML redirect so Set-Cookie is persisted (Next/Vercel can drop cookies on 302)
  const redirectUrl = origin + "/";
  const safeAttr = redirectUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const res = new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing in…</title></head><body data-redirect="${safeAttr}"><p>Signing you in…</p><a href="${redirectUrl}">Continue</a><script>var r=document.body.getAttribute("data-redirect");if(r)window.location.replace(r);</script></body></html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
  const cookieOptions: Parameters<NextResponse["cookies"]["set"]>[2] = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  };
  // Explicit domain so cookie persists on Vercel (request host can differ from canonical host)
  if (isProduction) {
    cookieOptions.domain = "tempoflowmusic.vercel.app";
  }
  res.cookies.set("spotify_token", access_token, cookieOptions);
  res.cookies.delete("spotify_verifier");
  return res;
}
