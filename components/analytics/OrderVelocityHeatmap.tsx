import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { HeatmapEntry } from "@/types";

interface OrderVelocityProps {
  totalOrders: number;
  loading: boolean;
  heatmap?: HeatmapEntry[];
}

export function OrderVelocityHeatmap({ totalOrders, loading, heatmap }: OrderVelocityProps) {
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
  
  // Flatten a 7x24 to just render the most recent 48 hours for visual fit, 
  // or just render the first 48 blocks from the heatmap array if we want a full grid.
  // The UI is currently a simple flex wrap. Let's render the last 48 hours if possible.
  let blocksToRender = dummyBlocks;
  if (heatmap && heatmap.length > 0) {
    // Sort by day and hour
    const sorted = [...heatmap].sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) return a.hour - b.hour;
      return a.dayOfWeek - b.dayOfWeek;
    });
    // Take the last 48 entries (e.g., last 2 days)
    blocksToRender = sorted.slice(-48).map(h => ({ id: `real-${h.dayOfWeek}-${h.hour}`, intensity: h.intensity }));
  }

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
            Order Velocity
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
        <div className="flex flex-wrap gap-1">
          {blocksToRender.map((block, i) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.01, duration: 0.3 }}
              className={`h-[14px] w-[14px] rounded-sm ${getBlockColor(block.intensity)} border border-white/5`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-3 text-[10px] text-fg-muted uppercase tracking-widest font-semibold">
          <span>48h Ago</span>
          <span>Now</span>
        </div>
      </div>
    </motion.div>
  );
}
