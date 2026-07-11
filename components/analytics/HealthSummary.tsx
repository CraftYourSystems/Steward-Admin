import React from "react";
import { motion } from "framer-motion";
import type { AnalyticsSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface HealthSummaryProps {
  data?: AnalyticsSummary;
  loading: boolean;
  activeRange: string;
}

export function HealthSummary({ data, loading, activeRange }: HealthSummaryProps) {
  if (loading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="h-8 w-2/3 animate-shimmer rounded-lg bg-white/5" />
        <div className="h-4 w-1/2 animate-shimmer rounded-lg bg-white/5" />
      </div>
    );
  }

  if (!data) return null;

  const { totalRevenue, completedOrders, totalOrders, avgPrepTimeMins } = data;

  // Determine range label
  let rangeLabel = "today";
  if (activeRange === "yesterday") rangeLabel = "yesterday";
  else if (activeRange === "7d") rangeLabel = "in the last 7 days";
  else if (activeRange === "30d") rangeLabel = "in the last 30 days";

  // Determine health state
  let state: "optimal" | "warning" | "critical" = "optimal";
  let title = "Operations are running smoothly.";
  let description = `You have completed ${completedOrders} orders ${rangeLabel}, generating ${formatCurrency(totalRevenue)} in revenue. The kitchen is maintaining an average prep time of ${avgPrepTimeMins.toFixed(0)} minutes.`;

  if (avgPrepTimeMins > 25) {
    state = "warning";
    title = "Kitchen is experiencing high load.";
    description = `Prep times have risen to ${avgPrepTimeMins.toFixed(0)} minutes. You have ${totalOrders - completedOrders} active orders waiting. Consider opening another station.`;
  }
  if (data.cancellationRate > 15) {
    state = "critical";
    title = "High cancellation rate detected.";
    description = `Your cancellation rate is currently ${data.cancellationRate.toFixed(1)}%. Check the kitchen for bottlenecks or ingredient shortages.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {state === "optimal" && <Sparkles className="h-5 w-5 text-accent shrink-0" />}
          {state === "warning" && <AlertCircle className="h-5 w-5 text-warning shrink-0" />}
          {state === "critical" && <AlertCircle className="h-5 w-5 text-danger shrink-0" />}
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-fg">
            {title}
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle bg-white/5 px-3 py-1.5 rounded-full border border-white/10 shadow-sm self-start md:self-center">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${state === 'optimal' ? 'bg-success' : state === 'warning' ? 'bg-warning' : 'bg-danger'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${state === 'optimal' ? 'bg-success' : state === 'warning' ? 'bg-warning' : 'bg-danger'}`} />
          </span>
          System Status: <span className={state === 'optimal' ? 'text-success' : state === 'warning' ? 'text-warning' : 'text-danger'}>{state}</span>
        </div>
      </div>
      <p className="text-[13px] sm:text-[14px] leading-relaxed text-fg-muted max-w-4xl">
        {description}
      </p>
    </motion.div>
  );
}
