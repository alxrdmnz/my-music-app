import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPOTIFY_API = "https://api.spotify.com/v1";

export async function GET(req: Request) {
  const token = (await cookies()).get("spotify_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type") ?? "artist,track";
  if (!q?.trim()) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  const res = await fetch(
    `${SPOTIFY_API}/search?${new URLSearchParams({
      q: q.trim(),
      type,
      limit: "10",
    })}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: res.status === 401 ? "Unauthorized" : `Spotify: ${res.status}` },
      { status: res.status === 401 ? 401 : 502 }
    );
  }

  const data = (await res.json()) as {
    artists?: { items?: { id: string; name: string }[] };
    tracks?: { items?: { id: string; name: string; artists?: { id: string; name: string }[] }[] };
  };
  return NextResponse.json({
    artists: data.artists ?? {},
    tracks: data.tracks ?? {},
  });
}
