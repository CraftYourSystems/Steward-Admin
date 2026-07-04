import React from "react";
import { motion } from "framer-motion";
import type { AnalyticsSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface HealthSummaryProps {
  data?: AnalyticsSummary;
  loading: boolean;
}

export function HealthSummary({ data, loading }: HealthSummaryProps) {
  if (loading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="h-8 w-2/3 animate-shimmer rounded-lg bg-surface-2" />
        <div className="h-4 w-1/2 animate-shimmer rounded-lg bg-surface-2" />
      </div>
    );
  }

  if (!data) return null;

  const { totalRevenue, completedOrders, totalOrders, avgPrepTimeMins } = data;

  // Determine health state
  let state: "optimal" | "warning" | "critical" = "optimal";
  let title = "Operations are running smoothly.";
  let description = `You have completed ${completedOrders} orders today, generating ${formatCurrency(totalRevenue)} in revenue. The kitchen is maintaining an average prep time of ${avgPrepTimeMins.toFixed(0)} minutes.`;

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
      className="flex flex-col sm:flex-row sm:items-start justify-between gap-6"
    >
      <div className="space-y-3 max-w-2xl">
        <div className="flex items-center gap-2">
          {state === "optimal" && <Sparkles className="h-5 w-5 text-accent" />}
          {state === "warning" && <AlertCircle className="h-5 w-5 text-warning" />}
          {state === "critical" && <AlertCircle className="h-5 w-5 text-danger" />}
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
            {title}
          </h2>
        </div>
        <p className="text-[15px] leading-relaxed text-fg-muted">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3 self-start">
        <div className="flex items-center gap-2 text-[13px] font-medium text-fg-subtle bg-surface-2 px-3 py-1.5 rounded-full border border-border shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${state === 'optimal' ? 'bg-success' : state === 'warning' ? 'bg-warning' : 'bg-danger'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${state === 'optimal' ? 'bg-success' : state === 'warning' ? 'bg-warning' : 'bg-danger'}`} />
          </span>
          System Status: {state.charAt(0).toUpperCase() + state.slice(1)}
        </div>
      </div>
    </motion.div>
  );
}
