export type ActivityType = "yoga" | "low" | "high";

export type ProgressionType = "linear" | "hiit";

export const ACTIVITIES: Record<
  ActivityType,
  { label: string; bpmMin: number; bpmMax: number }
> = {
  yoga: { label: "Yoga", bpmMin: 60, bpmMax: 90 },
  low: { label: "Low Intensity", bpmMin: 100, bpmMax: 120 },
  high: { label: "High Intensity", bpmMin: 130, bpmMax: 170 },
};

export const PROGRESSIONS: Record<ProgressionType, { label: string }> = {
  linear: { label: "Linear Ramp" },
  hiit: { label: "HIIT Intervals" },
};

export const AVG_TRACK_DURATION_MS = 3.5 * 60 * 1000; // 3.5 minutes

export interface SlotBPM {
  index: number;
  targetBpm: number;
  minBpm: number;
  maxBpm: number;
}

export interface SeedItem {
  id: string;
  name: string;
  type: "artist" | "track";
}
