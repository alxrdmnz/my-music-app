import { auth } from "@/auth";
import { NextResponse } from "next/server";

const SPOTIFY_API = "https://api.spotify.com/v1";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type") ?? "artist,track";
  if (!q?.trim()) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${SPOTIFY_API}/search?${new URLSearchParams({
        q: q.trim(),
        type,
        limit: "10",
      })}`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Spotify search error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
