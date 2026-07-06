import React from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee, TrendingUp } from "lucide-react";

interface RevenueRingProps {
  current: number;
  loading: boolean;
  activeRange: string;
}

export function RevenueRing({ current, loading, activeRange }: RevenueRingProps) {
  let label = "Today's Revenue";
  let target = 50000;
  if (activeRange === "yesterday") {
    label = "Yesterday's Revenue";
    target = 50000;
  } else if (activeRange === "7d") {
    label = "7-Day Revenue";
    target = 350000;
  } else if (activeRange === "30d") {
    label = "30-Day Revenue";
    target = 1500000;
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = circumference - percentage * circumference;

  if (loading) {
    return (
      <div className="card-premium p-6 flex items-center justify-between animate-shimmer min-h-[160px]">
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="card-premium p-6 flex items-center gap-8 relative overflow-hidden"
    >
      <div className="relative h-32 w-32 shrink-0">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="stroke-border"
            strokeWidth="8"
            fill="transparent"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            className="stroke-accent"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tighter text-fg">
            {Math.round(percentage * 100)}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="label-xs text-fg-muted">{label}</h3>
        <div className="text-4xl font-bold tracking-tighter text-fg flex items-baseline gap-1">
          {formatCurrency(current).split(".")[0]}
          <span className="text-lg text-fg-subtle">
            .{formatCurrency(current).split(".")[1]}
          </span>
        </div>
        <p className="text-[13px] text-fg-subtle flex items-center gap-1.5 mt-2">
          <TrendingUp className="h-3.5 w-3.5 text-success" />
          <span className="text-success font-medium">On track</span> to hit {formatCurrency(target)}
        </p>
      </div>

      {/* Decorative gradient blur in background */}
      <div className="absolute -right-20 -top-20 h-40 w-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
}
