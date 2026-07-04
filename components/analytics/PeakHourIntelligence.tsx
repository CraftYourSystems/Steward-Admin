"use client";

import { memo, useMemo } from "react";
import { BarChart3, Sun, Moon, Zap, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { PeakHourData } from "@/types";

interface Props {
  data?: PeakHourData;
  loading?: boolean;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export const PeakHourIntelligence = memo(function PeakHourIntelligence({ data, loading }: Props) {
  const maxOrders = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.distribution.map((h) => h.orders), 1);
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5">
        <Skeleton className="h-4 w-36 mb-4 bg-white/5" />
        <Skeleton className="h-36 w-full bg-white/5 rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center h-6 w-6 rounded-md bg-info/10 border border-info/20">
            <BarChart3 className="h-3 w-3 text-info" />
          </div>
          <span className="text-[13px] font-semibold text-fg">Peak Hour Intelligence</span>
        </div>

        {/* Peak callout */}
        {data.peakHour !== null && (
          <div className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1">
            <Zap className="h-3 w-3 text-accent" />
            <span className="text-[11px] font-semibold text-accent num">
              Peak at {formatHour(data.peakHour)} · {data.peakOrders} orders · {formatCurrency(data.peakRevenue)}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden -mx-1">
        <div className="flex items-end gap-[3px] h-32 min-w-[520px] px-1">
          {data.distribution.map((h) => {
            const pct = maxOrders > 0 ? (h.orders / maxOrders) * 100 : 0;
            return (
              <div key={h.hour} className="flex flex-col items-center gap-1 flex-1 group relative">
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 shadow-elevated text-center whitespace-nowrap">
                    <p className="text-[10px] font-semibold text-fg-muted">{formatHour(h.hour)}</p>
                    <p className="text-[12px] font-semibold text-fg num">{h.orders} orders</p>
                    <p className="text-[10px] text-fg-subtle num">{formatCurrency(h.revenue)}</p>
                  </div>
                </div>

                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all duration-300",
                    h.isPeak
                      ? "bg-accent shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                      : h.isQuiet
                        ? "bg-warning/30"
                        : h.orders > 0
                          ? "bg-accent/40"
                          : "bg-white/5"
                  )}
                  style={{ height: `${Math.max(pct, h.orders > 0 ? 8 : 3)}%` }}
                />

                {/* Labels */}
                {h.hour % 3 === 0 && (
                  <span className="text-[7px] sm:text-[8px] text-fg-subtle num">{h.hour}h</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend + insights */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-[10px] text-fg-subtle">
          <div className="h-2 w-2 rounded-full bg-accent" /> Peak hour
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-fg-subtle">
          <div className="h-2 w-2 rounded-full bg-accent/40" /> Active
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-fg-subtle">
          <div className="h-2 w-2 rounded-full bg-warning/30" /> Quiet
        </div>
        <span className="text-[10px] text-fg-subtle ml-auto num">
          Avg: {data.avgOrdersPerHour} orders/hr
        </span>
      </div>

      {/* Quiet hours callout */}
      {data.quietHours.length > 0 && (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-fg-subtle">
          <Volume2 className="h-3 w-3 mt-0.5 shrink-0 text-warning" />
          <span>
            Quiet hours: {data.quietHours.map((h) => formatHour(h)).join(", ")} — consider staff adjustments or promotions.
          </span>
        </div>
      )}
    </div>
  );
});
