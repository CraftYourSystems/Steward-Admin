"use client";

import { useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { RefreshCw } from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { TodaysInsights } from "@/components/analytics/TodaysInsights";
import { BestWorstSellers } from "@/components/analytics/BestWorstSellers";
import { PeakHourIntelligence } from "@/components/analytics/PeakHourIntelligence";
import { HealthScoreCard } from "@/components/analytics/HealthScoreCard";
import { ItemCombinations } from "@/components/analytics/ItemCombinations";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRevenueData, useTopItems, useTodaysInsights,
  useItemPerformance, usePeakHour, useHealthScore,
  useItemCombinations,
} from "@/hooks/useAnalytics";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

// Lazy-load charts
const RevenueChart = lazy(() =>
  import("@/components/analytics/RevenueChart").then((m) => ({ default: m.RevenueChart }))
);
const TopItemsChart = lazy(() =>
  import("@/components/analytics/TopItemsChart").then((m) => ({ default: m.TopItemsChart }))
);

type QuickRange = "today" | "yesterday" | "7d" | "30d";
const ISO = (d: Date) => d.toISOString();

function getRange(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  switch (range) {
    case "today":
      return { from: ISO(startOfDay(now)), to: ISO(endOfDay(now)) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: ISO(startOfDay(y)), to: ISO(endOfDay(y)) };
    }
    case "7d":
      return { from: ISO(startOfDay(subDays(now, 6))), to: ISO(endOfDay(now)) };
    case "30d":
    default:
      return { from: ISO(startOfDay(subDays(now, 29))), to: ISO(endOfDay(now)) };
  }
}

const QUICK_RANGES: { label: string; value: QuickRange }[] = [
  { label: "Today",     value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "7D",        value: "7d" },
  { label: "30D",       value: "30d" },
];

const ChartSkeleton = () => <Skeleton className="h-48 sm:h-56 w-full rounded-[20px] bg-white/5" />;

export default function AnalyticsPage() {
  const restaurant = useAuthStore((s) => s.restaurant);
  const queryClient = useQueryClient();

  // ── Date range ─────────────────────────────────────────────────────────────
  const [activeRange, setActiveRange] = useState<QuickRange>("today");
  const params = useMemo(() => getRange(activeRange), [activeRange]);

  // Hook subscriptions
  const revenue = useRevenueData(params, activeRange);
  const topItems = useTopItems(params, activeRange);
  const insights = useTodaysInsights();
  const itemPerformance = useItemPerformance(params, activeRange);
  const peakHour = usePeakHour(params, activeRange);
  const healthScore = useHealthScore();
  const combinations = useItemCombinations(params, activeRange);

  // ── Refresh handler ────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["analytics-revenue"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-top-items"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-insights"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-item-performance"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-peak-hour"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-health-score"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-combinations"] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  const isFetching =
    revenue.isFetching ||
    topItems.isFetching ||
    insights.isFetching ||
    itemPerformance.isFetching ||
    peakHour.isFetching ||
    healthScore.isFetching ||
    combinations.isFetching;

  function RangeToggle() {
    return (
      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveRange(r.value)}
            className={cn(
              "h-7 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-150",
              activeRange === r.value
                ? "bg-white/5 text-fg border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div className="min-w-0">
          <div className="label-xs mb-1">{restaurant?.name ?? "Restaurant"}</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Analytics</h2>
          <p className="text-[12px] text-fg-subtle mt-1">
            Monitor restaurant performance and business insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isFetching}
            title="Refresh analytics"
            className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-white/5 text-fg-muted hover:text-fg hover:border-white/10 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (isRefreshing || isFetching) && "animate-spin")} />
          </button>
          <RangeToggle />
        </div>
      </div>

      {/* ── Today's Insights Banner ─────────────────────────────────────────── */}
      <TodaysInsights data={insights.data} loading={insights.isLoading} />

      {/* ── Section label ─────────────────────────────────────────────────── */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        Trends
      </p>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart data={revenue.data} loading={revenue.isLoading} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TopItemsChart data={topItems.data} loading={topItems.isLoading} />
        </Suspense>
      </div>

      {/* ── Section label ─────────────────────────────────────────────────── */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        Menu Performance
      </p>

      {/* ── Best / Worst Sellers ────────────────────────────────────────────── */}
      <BestWorstSellers data={itemPerformance.data} loading={itemPerformance.isLoading} />

      {/* ── Health Score & Combinations (side by side on lg) ────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        <HealthScoreCard data={healthScore.data} loading={healthScore.isLoading} />
        <ItemCombinations data={combinations.data} loading={combinations.isLoading} />
      </div>

      {/* ── Section label ─────────────────────────────────────────────────── */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        Peak Hours
      </p>

      {/* ── Peak Hour Intelligence ──────────────────────────────────────────── */}
      <PeakHourIntelligence data={peakHour.data} loading={peakHour.isLoading} />
    </div>
  );
}
