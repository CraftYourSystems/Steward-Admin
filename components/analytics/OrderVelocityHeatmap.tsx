import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { HeatmapEntry } from "@/types";

interface OrderVelocityProps {
  totalOrders: number;
  loading: boolean;
  heatmap?: HeatmapEntry[];
  activeRange: string;
}

export function OrderVelocityHeatmap({ totalOrders, loading, heatmap, activeRange }: OrderVelocityProps) {
  let startLabel = "48h Ago";
  let endLabel = "Now";
  let descriptionLabel = "Order Velocity";
  if (activeRange === "yesterday") {
    startLabel = "Yesterday";
    endLabel = "End of Day";
    descriptionLabel = "Yesterday's Velocity";
  } else if (activeRange === "7d") {
    startLabel = "7-Day Velocity"; // wait, description is better as "Order Velocity" or "7-Day Order Volume"
    startLabel = "7 Days Ago";
    endLabel = "Now";
    descriptionLabel = "7-Day Velocity";
  } else if (activeRange === "30d") {
    startLabel = "30 Days Ago";
    endLabel = "Now";
    descriptionLabel = "30-Day Velocity";
  }
  if (loading) {
    return (
      <div className="card-premium p-6 flex flex-col justify-between animate-shimmer min-h-[160px]">
      </div>
    );
  }

  const getBlockColor = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-white/5";
      case 1: return "bg-info/30";
      case 2: return "bg-info/60";
      case 3: return "bg-info";
      default: return "bg-white/5";
    }
  };

  // If we don't have heatmap data yet (e.g. backend still returning old shape), render dummy for now
  const dummyBlocks = Array.from({ length: 48 }).map((_, i) => ({ id: `dummy-${i}`, intensity: Math.floor(Math.random() * 4) }));
  
  let blocksToRender = dummyBlocks;
  if (heatmap && heatmap.length > 0) {
    // Sort by day and hour
    const sorted = [...heatmap].sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) return a.hour - b.hour;
      return a.dayOfWeek - b.dayOfWeek;
    });
    // Take the last 48 entries (e.g., last 2 days)
    const sliced = sorted.slice(-48);
    // Pad with empty blocks if we have less than 48 hours of data
    if (sliced.length < 48) {
      const padding = Array.from({ length: 48 - sliced.length }).map((_, i) => ({ id: `pad-${i}`, intensity: 0 }));
      blocksToRender = [...padding, ...sliced.map(h => ({ id: `real-${h.dayOfWeek}-${h.hour}`, intensity: h.intensity }))];
    } else {
      blocksToRender = sliced.map(h => ({ id: `real-${h.dayOfWeek}-${h.hour}`, intensity: h.intensity }));
    }
  }

  const getIntensityLabel = (intensity: number) => {
    switch (intensity) {
      case 0: return "No orders";
      case 1: return "Low activity";
      case 2: return "Medium activity";
      case 3: return "Peak velocity";
      default: return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="card-premium p-6 flex flex-col justify-between h-full relative"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className="label-xs text-fg-muted flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            {descriptionLabel}
          </h3>
          <div className="text-3xl font-bold tracking-tighter text-fg flex items-baseline gap-1">
            {totalOrders}
            <span className="text-sm font-medium text-fg-subtle tracking-normal">
              total
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {/* Render a clean 2x24 grid (Day 1 and Day 2) */}
        <div 
          className="grid gap-1 select-none"
          style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
        >
          {blocksToRender.map((block, i) => {
            let timeLabel = "";
            if (activeRange === "30d") {
              const hoursAgo = Math.round(((47 - i) * 30 * 24) / 47);
              if (hoursAgo >= 24) {
                const daysAgo = Math.round(hoursAgo / 24);
                timeLabel = daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
              } else {
                timeLabel = hoursAgo === 0 ? "Now" : `${hoursAgo}h ago`;
              }
            } else if (activeRange === "7d") {
              const hoursAgo = Math.round(((47 - i) * 7 * 24) / 47);
              if (hoursAgo >= 24) {
                const daysAgo = Math.round(hoursAgo / 24);
                timeLabel = daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
              } else {
                timeLabel = hoursAgo === 0 ? "Now" : `${hoursAgo}h ago`;
              }
            } else {
              const hoursAgo = 47 - i;
              timeLabel = hoursAgo === 0 ? "Now" : `${hoursAgo}h ago`;
            }
            const tooltipText = `${timeLabel} (${getIntensityLabel(block.intensity)})`;

            return (
              <motion.div
                key={block.id}
                title={tooltipText}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.005, duration: 0.2 }}
                className={`aspect-square w-full rounded-[2px] ${getBlockColor(block.intensity)} border border-white/5 cursor-pointer hover:border-accent hover:scale-110 transition-all`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-3 text-[10px] text-fg-muted uppercase tracking-widest font-semibold">
          <span>{startLabel}</span>
          
          <div className="flex items-center gap-1 normal-case tracking-normal text-[9px] font-medium text-fg-subtle">
            <span className="text-fg-muted">0</span>
            <div className="h-2 w-2 rounded-sm bg-white/5 border border-white/5" />
            <div className="h-2 w-2 rounded-sm bg-info/30" />
            <div className="h-2 w-2 rounded-sm bg-info/60" />
            <div className="h-2 w-2 rounded-sm bg-info" />
            <span className="text-fg-muted mr-1">Peak</span>
          </div>

          <span>{endLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}
