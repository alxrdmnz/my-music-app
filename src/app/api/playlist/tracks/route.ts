import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPOTIFY_API = "https://api.spotify.com/v1";

type SeedArtist = { id: string; name: string } | string;

/**
 * Build tracks from seed artists (Search by artist name) and seed track IDs (Get Track).
 * Artist name is sent from the client (from search when user added the seed); no GET /artists call.
 * Market defaults to US per Spotify Web API.
 */
export async function POST(req: Request) {
  const token = (await cookies()).get("spotify_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { seedArtists?: SeedArtist[]; seedTracks?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawArtists = body.seedArtists ?? [];
  const seedArtists: { id: string; name: string }[] = rawArtists
    .map((a: SeedArtist) =>
      typeof a === "string"
        ? { id: a.trim().replace(/^spotify:artist:/, ""), name: "" }
        : {
            id: String(a.id ?? "").trim().replace(/^spotify:artist:/, ""),
            name: String(a.name ?? "").trim(),
          }
    )
    .filter((a) => a.id.length > 0);

  const seedTracks = (body.seedTracks ?? [])
    .map((id) => String(id).trim().replace(/^spotify:track:/, ""))
    .filter(Boolean);

  if (seedArtists.length === 0 && seedTracks.length === 0) {
    return NextResponse.json(
      { error: "Add at least one artist or track seed" },
      { status: 400 }
    );
  }

  const headers = { Authorization: `Bearer ${token}` };
  const opts: RequestInit = { headers, cache: "no-store" };

  // Market: default US. Spotify docs: "If neither market or user country are provided, the content is considered unavailable."
  let market = "US";
  const meRes = await fetch(`${SPOTIFY_API}/me`, opts);
  if (meRes.status === 401) {
    return NextResponse.json({ error: "Session expired. Sign out and sign in again." }, { status: 401 });
  }
  if (meRes.ok) {
    const me = (await meRes.json()) as { country?: string };
    if (me.country && /^[A-Z]{2}$/i.test(me.country)) market = me.country.toUpperCase();
  }

  const tracks: {
    id: string;
    uri: string;
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album?: { images?: { url: string }[] };
  }[] = [];
  const seenUris = new Set<string>();

  const add = (t: {
    id: string;
    uri: string;
    name: string;
    duration_ms?: number;
    artists?: { name: string }[];
    album?: { images?: { url: string }[] };
  }) => {
    if (seenUris.has(t.uri)) return;
    seenUris.add(t.uri);
    tracks.push({
      id: t.id,
      uri: t.uri,
      name: t.name,
      duration_ms: t.duration_ms ?? 0,
      artists: t.artists ?? [],
      album: t.album,
    });
  };

  for (const artist of seedArtists) {
    const name = artist.name?.replace(/"/g, "").trim();
    if (!name) continue;

    const searchRes = await fetch(
      `${SPOTIFY_API}/search?${new URLSearchParams({
        q: name,
        type: "track",
        limit: "10",
        market,
      })}`,
      opts
    );
    if (searchRes.status === 401) {
      return NextResponse.json({ error: "Session expired. Sign out and sign in again." }, { status: 401 });
    }
    if (!searchRes.ok) continue;
    const searchData = (await searchRes.json()) as {
      tracks?: {
        items?: Array<{
          id: string;
          uri: string;
          name: string;
          duration_ms?: number;
          artists?: { name: string }[];
          album?: { images?: { url: string }[] };
        }>;
      };
    };
    const items = searchData.tracks?.items ?? [];
    for (const t of items) add(t);
  }

  for (const trackId of seedTracks) {
    const res = await fetch(`${SPOTIFY_API}/tracks/${encodeURIComponent(trackId)}?market=${market}`, opts);
    if (res.status === 401) {
      return NextResponse.json({ error: "Session expired. Sign out and sign in again." }, { status: 401 });
    }
    if (!res.ok) continue;
    const t = (await res.json()) as {
      id: string;
      uri: string;
      name: string;
      duration_ms?: number;
      artists?: { name: string }[];
      album?: { images?: { url: string }[] };
    };
    add(t);
  }

  if (tracks.length === 0) {
    return NextResponse.json(
      { error: "No tracks found for your seeds." },
      { status: 404 }
    );
  }

  return NextResponse.json({ tracks });
}
