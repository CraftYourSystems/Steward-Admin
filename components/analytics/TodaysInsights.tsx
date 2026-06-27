"use client";

import { memo } from "react";
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingBag,
  Clock, Wallet, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { TodaysInsightsData } from "@/types";

interface Props {
  data?: TodaysInsightsData;
  loading?: boolean;
}

interface InsightPill {
  label: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
  /** true when a positive change is "bad" (e.g. prep time going up) */
  invertColor?: boolean;
}

export const TodaysInsights = memo(function TodaysInsights({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4 rounded bg-surface-3" />
          <Skeleton className="h-4 w-28 rounded bg-surface-3" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-surface-3" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pills: InsightPill[] = [
    {
      label: "Revenue",
      value: formatCurrency(data.today.revenue),
      change: data.changes.revenue,
      icon: IndianRupee,
    },
    {
      label: "Orders",
      value: String(data.today.orders),
      change: data.changes.orders,
      icon: ShoppingBag,
    },
    {
      label: "Avg Order",
      value: formatCurrency(data.today.avgOrderValue),
      change: data.changes.avgOrderValue,
      icon: Wallet,
    },
    {
      label: "Prep Time",
      value: `${data.today.avgPrepMins}m`,
      change: data.changes.avgPrepMins,
      icon: Clock,
      invertColor: true,
    },
  ];

  return (
    <div className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/[0.04] to-transparent p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="grid place-items-center h-6 w-6 rounded-md bg-accent/10 border border-accent/20">
          <Sparkles className="h-3 w-3 text-accent" />
        </div>
        <span className="text-[13px] font-semibold text-fg">Today&apos;s Insights</span>
        <span className="text-[11px] text-fg-subtle">vs yesterday</span>
      </div>

      {/* Metric pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pills.map((pill) => {
          const isPositive = pill.invertColor ? pill.change <= 0 : pill.change >= 0;
          const Icon = pill.icon;
          return (
            <div
              key={pill.label}
              className="rounded-lg border border-border bg-surface/70 px-3 py-2.5 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-fg-subtle" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  {pill.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold text-fg num tracking-tight leading-none">
                  {pill.value}
                </span>
                {pill.change !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-semibold num rounded-full px-1.5 py-0.5",
                      isPositive
                        ? "text-success bg-success/10"
                        : "text-danger bg-danger/10"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {pill.change > 0 ? "+" : ""}
                    {pill.change.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
