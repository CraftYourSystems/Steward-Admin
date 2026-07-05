"use client";

import { Suspense, lazy } from "react";
import { Clock, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { TodaysInsights } from "@/components/analytics/TodaysInsights";
import { BestWorstSellers } from "@/components/analytics/BestWorstSellers";
import { PeakHourIntelligence } from "@/components/analytics/PeakHourIntelligence";
import { CompositeScoringWidget } from "@/components/analytics/CompositeScoringWidget";
import { ItemCombinations } from "@/components/analytics/ItemCombinations";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

// Lazy-load charts
const RevenueChart = lazy(() =>
  import("@/components/analytics/RevenueChart").then((m) => ({ default: m.RevenueChart }))
);
const TopItemsChart = lazy(() =>
  import("@/components/analytics/TopItemsChart").then((m) => ({ default: m.TopItemsChart }))
);

const ChartSkeleton = () => <Skeleton className="h-48 sm:h-56 w-full rounded-[20px] bg-white/5" />;

export function OverviewTab({
  insights,
  summary,
  accuracy,
  revenue,
  topItems,
  itemPerformance,
  healthScore,
  combinations,
  peakHour,
}: any) {
  return (
    <div className="space-y-4 sm:space-y-5 mt-4">
      <TodaysInsights data={insights.data} loading={insights.isLoading} />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mt-4">
        <KpiCard
          title="Kitchen Delay"
          value={summary.data?.avgKitchenDelayMins ? `${summary.data.avgKitchenDelayMins}m` : "0m"}
          icon={Clock}
          loading={summary.isLoading}
          description="Avg wait before prep starts"
          accent="warning"
        />
        <KpiCard
          title="Rev per Customer"
          value={summary.data?.revenuePerCustomer ? formatCurrency(summary.data.revenuePerCustomer) : formatCurrency(0)}
          icon={Wallet}
          loading={summary.isLoading}
          description="Average spend per unique customer"
          accent="success"
        />
        <KpiCard
          title="Order Accuracy"
          value={accuracy.data?.accuracyPercentage !== undefined ? `${accuracy.data.accuracyPercentage}%` : "100%"}
          icon={CheckCircle2}
          loading={accuracy.isLoading}
          description="Served without corrections"
          accent="info"
        />
        <KpiCard
          title="Cancellation Rate"
          value={summary.data?.cancellationRate !== undefined ? `${summary.data.cancellationRate.toFixed(1)}%` : "0%"}
          icon={XCircle}
          loading={summary.isLoading}
          description="Percentage of cancelled orders"
          accent="danger"
        />
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">Trends</p>

      <div className="grid gap-3 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart data={revenue.data} loading={revenue.isLoading} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TopItemsChart data={topItems.data} loading={topItems.isLoading} />
        </Suspense>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">Menu Performance</p>

      <BestWorstSellers data={itemPerformance.data} loading={itemPerformance.isLoading} />

      <div className="grid gap-3 lg:grid-cols-2">
        <CompositeScoringWidget />
        <ItemCombinations data={combinations.data} loading={combinations.isLoading} />
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">Peak Hours</p>

      <PeakHourIntelligence data={peakHour.data} loading={peakHour.isLoading} />
    </div>
  );
}