import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SPOTIFY_API = "https://api.spotify.com/v1";

export async function POST(req: Request) {
  const token = (await cookies()).get("spotify_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { name?: string; description?: string; trackUris?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name = "TempoFlow Playlist", description = "", trackUris = [] } = body;
  if (!trackUris.length) {
    return NextResponse.json({ error: "trackUris required" }, { status: 400 });
  }

  const createRes = await fetch(`${SPOTIFY_API}/me/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description: description || undefined,
      public: false,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return NextResponse.json(
      { error: `Create playlist: ${createRes.status} ${text}` },
      { status: createRes.status === 401 ? 401 : 502 }
    );
  }

  const playlist = (await createRes.json()) as { id: string; external_urls?: { spotify?: string } };
  const playlistId = playlist.id;

  // Add Items to Playlist (current API: /items not deprecated /tracks). Max 100 per request.
  const CHUNK_SIZE = 100;
  for (let i = 0; i < trackUris.length; i += CHUNK_SIZE) {
    const chunk = trackUris.slice(i, i + CHUNK_SIZE);
    const addRes = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/items`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: chunk }),
    });

    if (!addRes.ok) {
      const text = await addRes.text();
      const status = addRes.status;
      const message =
        status === 403
          ? "Permission denied. Sign out and sign in again so the app can save playlists to your account."
          : `Add tracks: ${status} ${text}`;
      return NextResponse.json(
        { error: message },
        { status: status === 401 ? 401 : 502 }
      );
    }
  }

  return NextResponse.json({
    playlistId,
    playlistUrl: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlistId}`,
  });
}
