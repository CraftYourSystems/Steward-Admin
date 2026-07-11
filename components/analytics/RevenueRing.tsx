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

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = circumference - percentage * circumference;

  if (loading) {
    return (
      <div className="card-premium p-5 sm:p-6 flex flex-col justify-between animate-shimmer min-h-[220px]">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-md bg-white/5" />
          <div className="h-8 w-36 rounded-md bg-white/5" />
        </div>
        <div className="h-16 w-16 rounded-full bg-white/5 self-end" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="card-premium p-5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden group min-h-[220px]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3 className="label-xs text-fg-muted flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" />
            {label}
          </h3>
          <div className="text-3xl font-bold tracking-tighter text-fg flex items-baseline gap-1">
            {formatCurrency(current).split(".")[0]}
            <span className="text-sm font-medium text-fg-subtle tracking-normal">
              .{formatCurrency(current).split(".")[1]}
            </span>
          </div>
        </div>
        <div className="text-[11px] font-medium text-success bg-success/10 px-2 py-1 rounded-md border border-success/20">
          Target: {formatCurrency(target).split(".")[0]}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-auto pt-2">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              className="stroke-border"
              strokeWidth="10"
              fill="transparent"
            />
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              className="stroke-accent"
              strokeWidth="10"
              fill="transparent"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold tracking-tight text-fg">
              {Math.round(percentage * 100)}%
            </span>
          </div>
        </div>

        <p className="text-[12px] text-fg-subtle flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-success" />
          <span>
            <span className="text-success font-medium">On track</span> to hit target
          </span>
        </p>
      </div>

      {/* Decorative gradient blur in background */}
      <div className="absolute -right-20 -top-20 h-40 w-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
}
