"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Music, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SeedItem } from "@/types/playlist";

const MAX_SEEDS = 5;

async function searchSpotify(q: string): Promise<{
  artists?: { id: string; name: string }[];
  tracks?: { id: string; name: string; artists: { id: string; name: string }[] }[];
}> {
  const res = await fetch(
    `/api/spotify/search?${new URLSearchParams({ q, type: "artist,track" })}`,
    { credentials: "include" }
  );
  let data: { artists?: { items?: unknown[] }; tracks?: { items?: unknown[] }; error?: string } = {};
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await res.json();
  }
  if (!res.ok) {
    const msg = data?.error ?? res.statusText ?? "Search failed";
    throw new Error(typeof msg === "string" ? msg : "Search failed");
  }
  return {
    artists: (data.artists?.items ?? []).slice(0, 5) as { id: string; name: string }[],
    tracks: (data.tracks?.items ?? []).slice(0, 5) as { id: string; name: string; artists: { id: string; name: string }[] }[],
  };
}

interface SeedPickerProps {
  seeds: SeedItem[];
  onChange: (seeds: SeedItem[]) => void;
  disabled?: boolean;
}

export function SeedPicker({ seeds, onChange, disabled }: SeedPickerProps) {
  const [query, setQuery] = useState("");
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["spotify-search", query],
    queryFn: () => searchSpotify(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
    retry: false,
  });

  const addArtist = useCallback(
    (id: string, name: string) => {
      if (seeds.length >= MAX_SEEDS || seeds.some((s) => s.id === id)) return;
      onChange([...seeds, { id, name, type: "artist" }]);
      setQuery("");
    },
    [seeds, onChange]
  );

  const addTrack = useCallback(
    (id: string, name: string) => {
      if (seeds.length >= MAX_SEEDS || seeds.some((s) => s.id === id)) return;
      onChange([...seeds, { id, name, type: "track" }]);
      setQuery("");
    },
    [seeds, onChange]
  );

  const remove = useCallback(
    (id: string) => onChange(seeds.filter((s) => s.id !== id)),
    [seeds, onChange]
  );

  return (
    <div className="space-y-2 min-w-0 w-full">
      <div className="flex gap-2 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <Input
            placeholder="Search artists or tracks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refetch()}
            className="pl-9 min-w-0"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={disabled || !query.trim()}
        >
          <Search className="size-4" />
        </Button>
      </div>
      {seeds.length > 0 && (
        <div className="flex flex-wrap gap-2 min-w-0">
          {seeds.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 max-w-full rounded-lg bg-white/10 px-2.5 py-1 text-sm text-white min-w-0"
            >
              {s.type === "artist" ? (
                <User className="size-3.5 shrink-0 text-white/60" />
              ) : (
                <Music className="size-3.5 shrink-0 text-white/60" />
              )}
              <span className="truncate min-w-0">{s.name}</span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="shrink-0 rounded p-0.5 hover:bg-white/20"
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      {query.length >= 2 ? (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden max-h-48 overflow-y-auto">
          {isFetching ? (
            <div className="p-3 text-center text-sm text-white/50">Searching…</div>
          ) : isError ? (
            <div className="p-3 text-center text-sm text-amber-400">
              {error instanceof Error ? error.message : "Search failed"}
            </div>
          ) : (data?.artists?.length || data?.tracks?.length) ? (
            <>
          {data.artists?.length ? (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-white/50">Artists</p>
              {data.artists.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => addArtist(a.id, a.name)}
                  disabled={seeds.some((s) => s.id === a.id) || seeds.length >= MAX_SEEDS}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50"
                  )}
                >
                  <User className="size-4 text-white/50" />
                  {a.name}
                </button>
              ))}
            </div>
          ) : null}
          {data.tracks?.length ? (
            <div className="p-2 border-t border-white/10">
              <p className="px-2 py-1 text-xs font-medium text-white/50">Tracks</p>
              {data.tracks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addTrack(t.id, t.name)}
                  disabled={seeds.some((s) => s.id === t.id) || seeds.length >= MAX_SEEDS}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <Music className="size-4 text-white/50" />
                  <span className="truncate">
                    {t.name}
                    {t.artists?.length ? ` · ${t.artists.map((a) => a.name).join(", ")}` : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
            </>
          ) : (
            <div className="p-3 text-center text-sm text-white/50">No artists or tracks found</div>
          )}
        </div>
      ) : null}
      <p className="text-xs text-white/50">Add 1–5 artists or tracks—we’ll build your playlist from their sound.</p>
    </div>
  );
}
