"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data?: { delayedRate: number; totalDelayed: number; pareto: { reason: string; count: number }[] };
  loading?: boolean;
}

export const DelayedCausesChart = memo(function DelayedCausesChart({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-[90px] w-full bg-white/5 rounded-xl" />;
  if (!data) return null;

  const maxCount = data.pareto.length > 0 ? data.pareto[0].count : 1;
  const topCauses = data.pareto.slice(0, 3);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col h-[90px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-fg-subtle">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Delay Causes</span>
        </div>
        <span className="text-[11px] font-medium text-fg-muted">
          {data.delayedRate}% rate
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-1.5 overflow-hidden mt-1">
        {topCauses.length === 0 ? (
          <p className="text-[10px] text-fg-subtle italic">No delays recorded</p>
        ) : (
          topCauses.map((cause, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className="w-16 truncate text-fg-muted font-medium">{cause.reason}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning/80 rounded-full"
                  style={{ width: `${(cause.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right num text-fg-subtle">{cause.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
