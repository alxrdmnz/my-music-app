import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/** Always send user to 127.0.0.1 so they stay off localhost. */
function canonicalOrigin(req: Request): string {
  const url = new URL(req.url);
  const port = url.port || "3000";
  return `http://127.0.0.1:${port}`;
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("spotify_token");
  return NextResponse.redirect(canonicalOrigin(req) + "/");
}
