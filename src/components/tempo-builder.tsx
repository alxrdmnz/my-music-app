"use client";

import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Settings2, Loader2, Music2 } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CurveVisualizer } from "@/components/curve-visualizer";
import { SeedPicker } from "@/components/seed-picker";
import { CrossfadePreview } from "@/components/crossfade-preview";
import {
  ACTIVITIES,
  PROGRESSIONS,
  type ActivityType,
  type ProgressionType,
  type SeedItem,
} from "@/types/playlist";
import { buildBpmSlots } from "@/lib/playlist-engine";
import { cn } from "@/lib/utils";

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  duration_ms: number;
  album?: { images?: { url: string }[] };
}

async function generatePlaylist(
  slots: { targetBpm: number; minBpm: number; maxBpm: number }[],
  seedArtists: string[],
  seedTracks: string[]
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  for (const slot of slots) {
    const res = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetBpm: slot.targetBpm,
        minBpm: slot.minBpm,
        maxBpm: slot.maxBpm,
        seedArtists,
        seedTracks,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Slot ${slot.targetBpm} BPM failed`);
    }
    const { track } = await res.json();
    tracks.push({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artists: track.artists ?? [],
      duration_ms: track.duration_ms ?? 0,
      album: track.album,
    });
  }
  return tracks;
}

export function TempoBuilder() {
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [activity, setActivity] = useState<ActivityType>("low");
  const [progression, setProgression] = useState<ProgressionType>("linear");
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [generatedTracks, setGeneratedTracks] = useState<SpotifyTrack[] | null>(null);
  const [playlistName, setPlaylistName] = useState("TempoFlow Workout");

  const slots = useMemo(
    () => buildBpmSlots(durationMinutes, activity, progression),
    [durationMinutes, activity, progression]
  );

  const generateMutation = useMutation({
    mutationFn: () => {
      const seedArtists = seeds.filter((s) => s.type === "artist").map((s) => s.id);
      const seedTracks = seeds.filter((s) => s.type === "track").map((s) => s.id);
      if (!seedArtists.length && !seedTracks.length) {
        return Promise.reject(new Error("Add at least one artist or track seed"));
      }
      return generatePlaylist(slots, seedArtists, seedTracks);
    },
    onSuccess: (data) => setGeneratedTracks(data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedTracks?.length) throw new Error("No tracks to save");
      const res = await fetch("/api/playlist/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playlistName,
          description: `TempoFlow · ${ACTIVITIES[activity].label} · ${PROGRESSIONS[progression].label}`,
          trackUris: generatedTracks.map((t) => t.uri),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
  });

  const canGenerate =
    durationMinutes >= 5 &&
    durationMinutes <= 180 &&
    seeds.length >= 1 &&
    seeds.length <= 3;

  return (
    <div className="flex flex-col gap-6 pb-32">
      <CurveVisualizer slots={slots} progression={progression} />

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <Settings2 className="size-4" />
            Settings
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Workout settings</DrawerTitle>
            <DrawerDescription>
              Duration, activity, progression, and seeds
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-6 px-4 pb-8 overflow-y-auto max-h-[60vh]">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
              />
              <p className="text-xs text-white/50">
                ~{slots.length} tracks (3.5 min avg)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Activity</Label>
              <Tabs.Root
                value={activity}
                onValueChange={(v) => setActivity(v as ActivityType)}
              >
                <Tabs.List className="flex gap-2 rounded-xl bg-white/5 p-1">
                  {(Object.keys(ACTIVITIES) as ActivityType[]).map((key) => (
                    <Tabs.Trigger
                      key={key}
                      value={key}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/70"
                      )}
                    >
                      {ACTIVITIES[key].label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>
              <p className="text-xs text-white/50">
                {ACTIVITIES[activity].bpmMin}–{ACTIVITIES[activity].bpmMax} BPM
              </p>
            </div>
            <div className="space-y-2">
              <Label>Progression</Label>
              <Tabs.Root
                value={progression}
                onValueChange={(v) => setProgression(v as ProgressionType)}
              >
                <Tabs.List className="flex gap-2 rounded-xl bg-white/5 p-1">
                  {(Object.keys(PROGRESSIONS) as ProgressionType[]).map((key) => (
                    <Tabs.Trigger
                      key={key}
                      value={key}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/70"
                      )}
                    >
                      {PROGRESSIONS[key].label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            </div>
            <div className="space-y-2">
              <Label>Seeds (1–3 artists or tracks)</Label>
              <SeedPicker seeds={seeds} onChange={setSeeds} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={!canGenerate || generateMutation.isPending}
          variant="primary"
          className="flex-1"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Music2 className="size-4" />
              Generate playlist
            </>
          )}
        </Button>
      </div>

      {generateMutation.isError && (
        <p className="text-sm text-red-400">
          {generateMutation.error instanceof Error
            ? generateMutation.error.message
            : "Generation failed"}
        </p>
      )}

      {generatedTracks && generatedTracks.length > 0 && (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-white">Generated tracks</h2>
              <span className="text-sm text-white/50">{generatedTracks.length} tracks</span>
            </div>
            <ul className="divide-y divide-white/5 max-h-64 overflow-y-auto">
              {generatedTracks.map((t, i) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5"
                >
                  <span className="text-xs font-mono text-white/40 w-6">{i + 1}</span>
                  {t.album?.images?.[0]?.url ? (
                    <img
                      src={t.album.images[0].url}
                      alt=""
                      className="size-10 rounded object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded bg-white/10 flex items-center justify-center">
                      <Music2 className="size-5 text-white/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{t.name}</p>
                    <p className="text-xs text-white/50 truncate">
                      {t.artists?.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <CrossfadePreview tracks={generatedTracks} />

          <div className="flex flex-col gap-2">
            <Label>Playlist name</Label>
            <Input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="My TempoFlow playlist"
            />
            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Save to Spotify
            </Button>
            {saveMutation.isSuccess && (
              <p className="text-sm text-emerald-400">
                Playlist saved.{" "}
                {saveMutation.data?.playlistUrl ? (
                  <a
                    href={saveMutation.data.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Open in Spotify
                  </a>
                ) : null}
              </p>
            )}
            {saveMutation.isError && (
              <p className="text-sm text-red-400">
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : "Save failed"}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
