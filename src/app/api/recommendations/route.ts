import { auth } from "@/auth";
import { NextResponse } from "next/server";

const SPOTIFY_API = "https://api.spotify.com/v1";

/** Fetch one track for a slot. On strict failure, retry with wider tempo (prioritize genre/artist). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    targetBpm,
    minBpm,
    maxBpm,
    seedArtists = [],
    seedTracks = [],
  }: {
    targetBpm: number;
    minBpm: number;
    maxBpm: number;
    seedArtists: string[];
    seedTracks: string[];
  } = body;

  const seedArtistsStr = seedArtists.slice(0, 5).join(",");
  const seedTracksStr = seedTracks.slice(0, 5).join(",");
  if (!seedArtistsStr && !seedTracksStr) {
    return NextResponse.json(
      { error: "At least one seed artist or track required" },
      { status: 400 }
    );
  }

  async function fetchRecommendations(params: {
    target_tempo?: number;
    min_tempo: number;
    max_tempo: number;
  }) {
    const q = new URLSearchParams({
      limit: "1",
      min_tempo: String(params.min_tempo),
      max_tempo: String(params.max_tempo),
      ...(params.target_tempo != null && {
        target_tempo: String(params.target_tempo),
      }),
      ...(seedArtistsStr && { seed_artists: seedArtistsStr }),
      ...(seedTracksStr && { seed_tracks: seedTracksStr }),
    });
    const url = `${SPOTIFY_API}/recommendations?${q}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session!.accessToken}` },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || res.statusText);
    }
    return res.json();
  }

  try {
    let data = await fetchRecommendations({
      target_tempo: targetBpm,
      min_tempo: minBpm,
      max_tempo: maxBpm,
    });

    // If no tracks, prioritize genre/artist: retry with wider tempo window
    if (!data.tracks?.length) {
      const width = 25;
      data = await fetchRecommendations({
        min_tempo: Math.max(40, targetBpm - width),
        max_tempo: Math.min(200, targetBpm + width),
      });
    }

    if (!data.tracks?.length) {
      return NextResponse.json(
        { error: "No recommendations for this slot", slot: { targetBpm, minBpm, maxBpm } },
        { status: 404 }
      );
    }

    return NextResponse.json({ track: data.tracks[0] });
  } catch (e) {
    console.error("Recommendations error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Recommendations failed" },
      { status: 500 }
    );
  }
}
