import { auth } from "@/auth";
import { NextResponse } from "next/server";

const SPOTIFY_API = "https://api.spotify.com/v1";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, trackUris }: { name: string; description?: string; trackUris: string[] } =
    await req.json();
  if (!name || !Array.isArray(trackUris) || trackUris.length === 0) {
    return NextResponse.json(
      { error: "name and trackUris required" },
      { status: 400 }
    );
  }

  try {
    const createRes = await fetch(`${SPOTIFY_API}/users/me/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: description ?? "Created with TempoFlow",
        public: false,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(err || createRes.statusText);
    }
    const playlist = await createRes.json();

    const addRes = await fetch(
      `${SPOTIFY_API}/playlists/${playlist.id}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: trackUris }),
      }
    );
    if (!addRes.ok) {
      const err = await addRes.text();
      throw new Error(err || addRes.statusText);
    }

    return NextResponse.json({
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls?.spotify,
      snapshot_id: (await addRes.json()).snapshot_id,
    });
  } catch (e) {
    console.error("Create playlist error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create playlist" },
      { status: 500 }
    );
  }
}
