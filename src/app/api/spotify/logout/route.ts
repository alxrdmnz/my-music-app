import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppOrigin } from "@/lib/spotify-auth";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("spotify_token");
  return NextResponse.redirect(getAppOrigin(req) + "/");
}
