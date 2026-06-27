"use client";

import { memo } from "react";
import { Link2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemCombination } from "@/types";

interface Props {
  data?: ItemCombination[];
  loading?: boolean;
}

const BAR_COLORS = [
  "bg-accent",
  "bg-info",
  "bg-success",
  "bg-warning",
  "bg-danger/70",
];

export const ItemCombinations = memo(function ItemCombinations({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <Skeleton className="h-4 w-40 mb-4 bg-surface-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2 bg-surface-3 rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="grid place-items-center h-6 w-6 rounded-md bg-accent/10 border border-accent/20">
            <Link2 className="h-3 w-3 text-accent" />
          </div>
          <span className="text-[13px] font-semibold text-fg">Frequently Bought Together</span>
        </div>
        <div className="text-center py-6">
          <p className="text-[13px] text-fg-muted">Not enough data yet</p>
          <p className="text-[11px] text-fg-subtle mt-1">
            Combinations appear once items are ordered together in at least 2 orders
          </p>
        </div>
      </div>
    );
  }

  const maxFreq = Math.max(...data.map((d) => d.frequency), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="grid place-items-center h-6 w-6 rounded-md bg-accent/10 border border-accent/20">
          <Link2 className="h-3 w-3 text-accent" />
        </div>
        <span className="text-[13px] font-semibold text-fg">Frequently Bought Together</span>
        <span className="text-[11px] text-fg-subtle">Pair analysis</span>
      </div>

      {/* Combination rows */}
      <div className="space-y-2.5">
        {data.map((combo, i) => {
          const barWidth = (combo.frequency / maxFreq) * 100;
          return (
            <div
              key={`${combo.itemA.id}-${combo.itemB.id}`}
              className="relative rounded-lg border border-border bg-surface/50 px-3 py-2.5 overflow-hidden"
            >
              {/* Background bar */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 opacity-[0.06] rounded-l-lg",
                  BAR_COLORS[i % BAR_COLORS.length]
                )}
                style={{ width: `${barWidth}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-medium text-fg truncate max-w-[140px]">
                    {combo.itemA.name}
                  </span>
                  <ArrowRight className="h-3 w-3 text-fg-subtle shrink-0 hidden sm:block" />
                  <span className="text-[10px] text-fg-subtle sm:hidden">+</span>
                  <span className="text-[13px] font-medium text-fg truncate max-w-[140px]">
                    {combo.itemB.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[14px] font-semibold text-fg num">{combo.frequency}×</span>
                  <span className="text-[10px] text-fg-subtle ml-1 num">{combo.percentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <p className="text-[10px] text-fg-subtle mt-3 pt-3 border-t border-border">
        💡 Use these insights to create combo deals or position items near each other on the menu.
      </p>
    </div>
  );
});
