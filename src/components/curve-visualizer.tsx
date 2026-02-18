"use client";

import { motion } from "framer-motion";
import type { SlotBPM } from "@/types/playlist";
import { cn } from "@/lib/utils";

const SVG_WIDTH = 320;
const SVG_HEIGHT = 140;
const PAD = 24;

interface CurveVisualizerProps {
  slots: SlotBPM[];
  progression: "linear" | "hiit";
  className?: string;
}

export function CurveVisualizer({
  slots,
  progression,
  className,
}: CurveVisualizerProps) {
  if (slots.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-6",
          className
        )}
      >
        <p className="text-sm text-white/50">Set duration & activity to see curve</p>
      </div>
    );
  }

  const bpmMin = Math.min(...slots.map((s) => s.targetBpm));
  const bpmMax = Math.max(...slots.map((s) => s.targetBpm));
  const bpmRange = bpmMax - bpmMin || 1;
  const w = SVG_WIDTH - PAD * 2;
  const h = SVG_HEIGHT - PAD * 2;

  const points = slots.map((s, i) => {
    const x = PAD + (i / Math.max(1, slots.length - 1)) * w;
    const y = PAD + h - ((s.targetBpm - bpmMin) / bpmRange) * h;
    return `${x},${y}`;
  });
  const pathD =
    points.length === 1
      ? `M ${points[0]} L ${PAD + w},${PAD + h} L ${PAD},${PAD + h} Z`
      : `M ${points.join(" L ")}`;
  const areaD =
    points.length === 1
      ? pathD
      : `M ${PAD},${PAD + h} L ${points.join(" L ")} L ${PAD + w},${PAD + h} Z`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden",
        className
      )}
    >
      <div className="px-4 pt-3 pb-1 flex justify-between items-center">
        <span className="text-xs font-medium text-white/70">Intensity curve</span>
        <span className="text-xs text-white/50">
          {bpmMin} – {bpmMax} BPM
        </span>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="text-emerald-500/80"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="curve-fill"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaD}
          fill="url(#curve-fill)"
          initial={false}
          animate={{ d: areaD }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ d: pathD }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
    </div>
  );
}
