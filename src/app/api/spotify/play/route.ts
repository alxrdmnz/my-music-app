import { auth } from "@/auth";
import { NextResponse } from "next/server";

const SPOTIFY_API = "https://api.spotify.com/v1";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { device_id, uri, position_ms } = body as {
    device_id: string;
    uri: string;
    position_ms?: number;
  };
  if (!device_id || !uri) {
    return NextResponse.json(
      { error: "device_id and uri required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${SPOTIFY_API}/me/player/play?device_id=${encodeURIComponent(device_id)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [uri],
          ...(position_ms != null && { position_ms }),
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || res.statusText);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Play error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Play failed" },
      { status: 500 }
    );
  }
}
