"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeedPicker } from "@/components/seed-picker";
import type { SeedItem } from "@/types/playlist";

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  duration_ms: number;
  album?: { images?: { url: string }[] };
}

async function getTracksFromSeeds(
  seedArtists: { id: string; name: string }[],
  seedTracks: string[]
): Promise<SpotifyTrack[]> {
  const res = await fetch("/api/playlist/tracks", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seedArtists, seedTracks }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to get tracks");
  }
  const data = (await res.json()) as { tracks: SpotifyTrack[] };
  return data.tracks;
}

export function TempoBuilder() {
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [tracks, setTracks] = useState<SpotifyTrack[] | null>(null);
  const [playlistName, setPlaylistName] = useState("My playlist");

  const getTracksMutation = useMutation({
    mutationFn: () => {
      const seedArtists = seeds.filter((s) => s.type === "artist").map((s) => ({ id: s.id, name: s.name }));
      const seedTracks = seeds.filter((s) => s.type === "track").map((s) => s.id);
      if (!seedArtists.length && !seedTracks.length) {
        return Promise.reject(new Error("Add at least one artist or track"));
      }
      return getTracksFromSeeds(seedArtists, seedTracks);
    },
    onSuccess: (data) => setTracks(data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tracks?.length) throw new Error("No tracks to save");
      const res = await fetch("/api/playlist/create", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playlistName,
          description: "Created with TempoFlow",
          trackUris: tracks.map((t) => t.uri),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save");
      }
      return res.json() as Promise<{ playlistUrl?: string }>;
    },
  });

  const canGetTracks = seeds.length >= 1 && seeds.length <= 5;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Label>Artists or tracks</Label>
        <p className="text-xs text-white/50">Search and add 1–5 artists or tracks. We’ll build a playlist from their top tracks.</p>
        <SeedPicker seeds={seeds} onChange={setSeeds} />
      </div>

      <Button
        onClick={() => getTracksMutation.mutate()}
        disabled={!canGetTracks || getTracksMutation.isPending}
        variant="primary"
        className="w-full sm:w-auto"
      >
        {getTracksMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Getting tracks…
          </>
        ) : (
          <>
            <Music2 className="size-4" />
            Get playlist
          </>
        )}
      </Button>

      {getTracksMutation.isError && (
        <p className="text-sm text-red-400">
          {getTracksMutation.error instanceof Error ? getTracksMutation.error.message : "Failed"}
        </p>
      )}

      {tracks && tracks.length > 0 && (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-white">Tracks</h2>
              <span className="text-sm text-white/50">{tracks.length} tracks</span>
            </div>
            <ul className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {tracks.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5">
                  <span className="text-xs font-mono text-white/40 w-6">{i + 1}</span>
                  {t.album?.images?.[0]?.url ? (
                    <img src={t.album.images[0].url} alt="" className="size-10 rounded object-cover" />
                  ) : (
                    <div className="size-10 rounded bg-white/10 flex items-center justify-center">
                      <Music2 className="size-5 text-white/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{t.name}</p>
                    <p className="text-xs text-white/50 truncate">{t.artists?.map((a) => a.name).join(", ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Playlist name</Label>
            <Input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="My playlist"
            />
            <Button variant="primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save to Spotify
            </Button>
            {saveMutation.isSuccess && (
              <p className="text-sm text-emerald-400">
                Playlist saved.{" "}
                {saveMutation.data?.playlistUrl ? (
                  <a href={saveMutation.data.playlistUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Open in Spotify
                  </a>
                ) : null}
              </p>
            )}
            {saveMutation.isError && (
              <p className="text-sm text-red-400">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
                {saveMutation.error instanceof Error &&
                  saveMutation.error.message.includes("Sign out") && (
                    <>
                      {" "}
                      <a href="/api/spotify/logout" className="underline hover:text-red-300">
                        Sign out
                      </a>
                    </>
                  )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
