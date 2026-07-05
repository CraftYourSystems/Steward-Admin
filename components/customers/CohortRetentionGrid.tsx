"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Props { 
  data?: { month: string; total: number; retention: Record<number, number> }[]; 
  loading?: boolean; 
}

export const CohortRetentionGrid = memo(function CohortRetentionGrid({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
        <Skeleton className="h-48 w-full bg-white/5" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center h-56">
        <p className="text-[13px] text-fg-muted font-medium">No cohort data available</p>
      </div>
    );
  }

  // Find max months to display
  let maxMonths = 0;
  data.forEach(row => {
    const keys = Object.keys(row.retention).map(Number);
    if (keys.length > 0) {
      maxMonths = Math.max(maxMonths, Math.max(...keys));
    }
  });
  
  // Create column headers (Month 1, Month 2, etc. skipping Month 0 as it's 100%)
  const columns = Array.from({ length: maxMonths }, (_, i) => i + 1);

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 overflow-hidden flex flex-col">
      <div className="mb-4">
        <div className="label-xs mb-1">Cohort Retention</div>
        <p className="text-[11px] text-fg-subtle">Retention by first-order month</p>
      </div>

      <div className="overflow-x-auto scrollbar-thin flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className="font-semibold text-[10px] uppercase text-fg-subtle pb-2 pr-4 sticky left-0 bg-[#16161a] z-10">Cohort</th>
              <th className="font-semibold text-[10px] uppercase text-fg-subtle pb-2 pr-4 text-center">Size</th>
              {columns.map(m => (
                <th key={m} className="font-semibold text-[10px] uppercase text-fg-subtle pb-2 px-2 text-center">Mo {m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.month} className="border-t border-white/5">
                <td className="py-2.5 pr-4 text-[12px] font-medium text-fg whitespace-nowrap sticky left-0 bg-[#16161a] z-10 border-t border-white/5">
                  {format(parseISO(row.month + '-01'), "MMM yyyy")}
                </td>
                <td className="py-2.5 pr-4 text-[12px] text-fg-muted text-center num">{row.total}</td>
                {columns.map(m => {
                  const val = row.retention[m];
                  const hasData = val !== undefined;
                  
                  // Color scale: from deep red (low) to deep green (high)
                  // For a retention chart, > 40% is usually great, 10-30 is average
                  let bgClass = "bg-white/5";
                  if (hasData) {
                    if (val >= 40) bgClass = "bg-success/40";
                    else if (val >= 20) bgClass = "bg-success/20";
                    else if (val >= 10) bgClass = "bg-warning/20";
                    else if (val > 0) bgClass = "bg-danger/20";
                    else bgClass = "bg-white/5";
                  }

                  return (
                    <td key={m} className="p-1">
                      <div className={cn(
                        "h-8 flex items-center justify-center rounded-sm text-[11px] font-medium num",
                        bgClass,
                        hasData ? (val >= 20 ? "text-white" : "text-fg-muted") : "text-transparent"
                      )}>
                        {hasData ? `${val}%` : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
