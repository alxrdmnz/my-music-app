"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpotifyTrack } from "@/components/tempo-builder";

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";
const FADE_DURATION_MS = 2000;
const FADE_INTERVAL_MS = 100;
const PREVIEW_TAIL_MS = 10000; // last 10s of track A
const FADE_START_BEFORE_END_MS = 2000; // start fading 2s before end of preview

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (t: string) => void) => void;
        volume?: number;
      }) => {
        connect: () => Promise<boolean>;
        addListener: (event: string, cb: (v: { device_id: string }) => void) => boolean;
        getVolume: () => Promise<number>;
        setVolume: (v: number) => Promise<void>;
        disconnect: () => void;
      };
    };
  }
}

interface CrossfadePreviewProps {
  tracks: SpotifyTrack[];
}

export function CrossfadePreview({ tracks }: CrossfadePreviewProps) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const playerRef = useRef<InstanceType<NonNullable<typeof window.Spotify>["Player"]> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (tracks.length < 2) return;
    let cancelled = false;

    async function init() {
      const tokenRes = await fetch("/api/spotify/token");
      if (!tokenRes.ok || cancelled) return;
      const { accessToken } = await tokenRes.json();
      if (!accessToken || cancelled) return;

      if (!window.Spotify) {
        await new Promise<void>((resolve, reject) => {
          window.onSpotifyWebPlaybackSDKReady = resolve;
          const script = document.createElement("script");
          script.src = SDK_URL;
          script.async = true;
          script.onerror = () => reject(new Error("SDK load failed"));
          document.head.appendChild(script);
        });
      }
      if (cancelled) return;

      const player = new window.Spotify!.Player({
        name: "TempoFlow Preview",
        getOAuthToken: (cb) => cb(accessToken),
        volume: 1,
      });
      playerRef.current = player;

      player.addListener("ready", ({ device_id }) => {
        if (!cancelled) setDeviceId(device_id);
      });

      const ok = await player.connect();
      if (!ok && !cancelled) setError("Could not connect to Spotify");
      return () => {
        player.disconnect();
        playerRef.current = null;
      };
    }

    setLoading(true);
    setError(null);
    init().finally(() => setLoading(false));

    return () => {
      cancelled = true;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [tracks.length]);

  const previewTransition = useCallback(
    async (indexA: number, indexB: number) => {
      if (tracks.length < 2 || indexB >= tracks.length || !deviceId || !playerRef.current) return;
      const trackA = tracks[indexA];
      const trackB = tracks[indexB];
      const key = `${indexA}-${indexB}`;
      setPreviewing(key);
      setError(null);

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      const positionMs = Math.max(0, trackA.duration_ms - PREVIEW_TAIL_MS);
      const fadeStartMs = PREVIEW_TAIL_MS - FADE_START_BEFORE_END_MS; // 8s into the 10s preview

      try {
        await fetch("/api/spotify/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: deviceId,
            uri: trackA.uri,
            position_ms: positionMs,
          }),
        }).then((r) => {
          if (!r.ok) throw new Error("Play failed");
        });

        await playerRef.current.setVolume(1);

        setTimeout(() => {
          const steps = FADE_DURATION_MS / FADE_INTERVAL_MS;
          let step = 0;
          fadeIntervalRef.current = setInterval(async () => {
            step++;
            const v = Math.max(0, 1 - step / steps);
            await playerRef.current?.setVolume(v);
            if (step >= steps && fadeIntervalRef.current) {
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            }
          }, FADE_INTERVAL_MS);
        }, fadeStartMs);

        setTimeout(async () => {
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
          await fetch("/api/spotify/play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              device_id: deviceId,
              uri: trackB.uri,
              position_ms: 0,
            }),
          }).then((r) => {
            if (!r.ok) throw new Error("Play track B failed");
          });
          await playerRef.current?.setVolume(0);
          const steps = FADE_DURATION_MS / FADE_INTERVAL_MS;
          let step = 0;
          fadeIntervalRef.current = setInterval(async () => {
            step++;
            const v = Math.min(1, step / steps);
            await playerRef.current?.setVolume(v);
            if (step >= steps && fadeIntervalRef.current) {
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            }
          }, FADE_INTERVAL_MS);
        }, PREVIEW_TAIL_MS);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Preview failed");
      } finally {
        setTimeout(() => setPreviewing(null), PREVIEW_TAIL_MS + FADE_DURATION_MS + 500);
      }
    },
    [tracks, deviceId]
  );

  if (tracks.length < 2) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-900/95 backdrop-blur-xl safe-area-pb">
      <div className="mx-auto max-w-2xl px-4 py-3">
        <p className="text-xs font-medium text-white/60 mb-2">Preview transition</p>
        <div className="flex flex-wrap gap-2">
          {tracks.slice(0, -1).map((_, i) => (
            <Button
              key={`${i}-${i + 1}`}
              variant="outline"
              size="sm"
              disabled={loading || !deviceId || previewing !== null}
              onClick={() => previewTransition(i, i + 1)}
            >
              {previewing === `${i}-${i + 1}` ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {i + 1} → {i + 2}
            </Button>
          ))}
        </div>
        {loading && (
          <p className="text-xs text-white/50 mt-1">Connecting to Spotify…</p>
        )}
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
        {!deviceId && !loading && (
          <p className="text-xs text-white/50 mt-1">
            Connect failed. Ensure Spotify Premium and try again.
          </p>
        )}
      </div>
    </div>
  );
}
