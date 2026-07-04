import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface OrderVelocityProps {
  totalOrders: number;
  loading: boolean;
}

// Generate dummy heatmap blocks for visual effect
const blocks = Array.from({ length: 48 }).map((_, i) => {
  // Random intensity between 0 and 3
  const intensity = Math.floor(Math.random() * 4);
  return { id: i, intensity };
});

export function OrderVelocityHeatmap({ totalOrders, loading }: OrderVelocityProps) {
  if (loading) {
    return (
      <div className="card-premium p-6 flex flex-col justify-between animate-shimmer min-h-[160px]">
      </div>
    );
  }

  const getBlockColor = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-surface-3";
      case 1: return "bg-info/30";
      case 2: return "bg-info/60";
      case 3: return "bg-info";
      default: return "bg-surface-3";
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
          {blocks.map((block, i) => (
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
          <span>8 AM</span>
          <span>Now</span>
        </div>
      </div>
    </motion.div>
  );
}
