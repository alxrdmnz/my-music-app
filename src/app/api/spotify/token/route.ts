import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/** Returns the current user's access token from the session cookie (for client-side use if needed). */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({ accessToken: token });
}
