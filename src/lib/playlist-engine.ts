import {
  type ActivityType,
  type ProgressionType,
  ACTIVITIES,
  AVG_TRACK_DURATION_MS,
  type SlotBPM,
} from "@/types/playlist";

/**
 * Number of tracks needed for a given duration (based on 3.5 min average).
 */
export function getTrackCount(durationMinutes: number): number {
  const totalMs = durationMinutes * 60 * 1000;
  return Math.max(1, Math.floor(totalMs / AVG_TRACK_DURATION_MS));
}

/**
 * Linear Ramp: BPM_current = BPM_start + (Index / TotalTracks) * (BPM_end - BPM_start)
 */
function linearBpm(
  index: number,
  totalTracks: number,
  bpmStart: number,
  bpmEnd: number
): number {
  if (totalTracks <= 1) return (bpmStart + bpmEnd) / 2;
  const t = index / (totalTracks - 1);
  return Math.round(bpmStart + t * (bpmEnd - bpmStart));
}

/**
 * HIIT: even index => PeakBPM, odd index => RestBPM
 */
function hiitBpm(
  index: number,
  peakBpm: number,
  restBpm: number
): number {
  return index % 2 === 0 ? peakBpm : restBpm;
}

/** Tempo window for Spotify (target ± margin). Use ~10 BPM margin for strictness. */
const TEMPO_MARGIN = 10;

export function buildBpmSlots(
  durationMinutes: number,
  activity: ActivityType,
  progression: ProgressionType
): SlotBPM[] {
  const totalTracks = getTrackCount(durationMinutes);
  const { bpmMin, bpmMax } = ACTIVITIES[activity];
  const slots: SlotBPM[] = [];

  for (let i = 0; i < totalTracks; i++) {
    const targetBpm =
      progression === "linear"
        ? linearBpm(i, totalTracks, bpmMin, bpmMax)
        : hiitBpm(i, bpmMax, bpmMin);
    const minBpm = Math.max(40, targetBpm - TEMPO_MARGIN);
    const maxBpm = Math.min(200, targetBpm + TEMPO_MARGIN);
    slots.push({
      index: i,
      targetBpm,
      minBpm,
      maxBpm,
    });
  }

  return slots;
}
