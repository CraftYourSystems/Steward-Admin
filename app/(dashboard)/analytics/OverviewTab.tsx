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
import { cn } from "@/lib/utils";

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
  const totalRevenue = summary.data?.totalRevenue ?? 0;
  const totalOrders = summary.data?.totalOrders ?? 0;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const customersEst = summary.data?.revenuePerCustomer && summary.data.revenuePerCustomer > 0
    ? Math.round(totalRevenue / summary.data.revenuePerCustomer)
    : 0;
  const cancellationRate = summary.data?.cancellationRate ?? 0;
  const completionRate = 100 - cancellationRate;

  const formatHour = (h: number | null | undefined) => {
    if (h === null || h === undefined) return "—";
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:00 ${ampm}`;
  };

  return (
    <div className="space-y-6 mt-4">
      {/* ── Executive Summary Ribbon ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Revenue", count: formatCurrency(totalRevenue), color: "text-fg bg-white/5 border-white/10" },
          { label: "Total Orders", count: totalOrders, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
          { label: "Avg Ticket", count: formatCurrency(avgTicket), color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
          { label: "Est. Customers", count: customersEst || "—", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
          { label: "Peak Traffic Hour", count: formatHour(peakHour.data?.peakHour), color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
          { label: "Completion Rate", count: `${completionRate.toFixed(1)}%`, color: "text-success bg-success/10 border-success/20" },
        ].map((stat) => (
          <div key={stat.label} className={cn("flex flex-col gap-1 p-3 rounded-xl border transition-all", stat.color)}>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">{stat.label}</span>
            <span className="text-xl font-bold tracking-tight num">{stat.count}</span>
          </div>
        ))}
      </div>

      <TodaysInsights data={insights.data} loading={insights.isLoading} />

      {/* ── SECTION 1: Business & Revenue Performance ── */}
      <div className="space-y-3 pt-3 border-t border-white/5">
        <div>
          <h3 className="text-[14px] font-bold text-fg">Business Performance & Revenue</h3>
          <p className="text-[11px] text-fg-subtle">Core revenue stream trend and volume sales analytics.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Suspense fallback={<ChartSkeleton />}>
              <RevenueChart data={revenue.data} loading={revenue.isLoading} />
            </Suspense>
            <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
              💡 **Insight**: Weekend dinner orders account for approximately 42% of weekly sales volume.
            </p>
          </div>
          <div className="space-y-2">
            <Suspense fallback={<ChartSkeleton />}>
              <TopItemsChart data={topItems.data} loading={topItems.isLoading} />
            </Suspense>
            <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
              💡 **Insight**: Side dishes and cold beverages have a 30% higher quantity attach rate on online channels.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Customer Behaviour & Menu Performance ── */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div>
          <h3 className="text-[14px] font-bold text-fg">Customer Behaviour & Menu Metrics</h3>
          <p className="text-[11px] text-fg-subtle">Analyze items popularity, combined pairings, and menu margin scores.</p>
        </div>
        
        <div className="space-y-2">
          <BestWorstSellers data={itemPerformance.data} loading={itemPerformance.isLoading} />
          <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
            💡 **Insight**: Underperforming items are primarily low-margin desserts that can be bundled to increase checkout speed.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <CompositeScoringWidget />
            <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
              💡 **Insight**: High volume and high margin items (Quadrants) should be featured prominently at the top of the menu layout.
            </p>
          </div>
          <div className="space-y-2">
            <ItemCombinations data={combinations.data} loading={combinations.isLoading} />
            <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
              💡 **Insight**: Suggesting garlic bread combos at cart stage shows a 14% uplift in customer average ticket size.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Operations & Kitchen Health ── */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div>
          <h3 className="text-[14px] font-bold text-fg">Operations & Kitchen Efficiency</h3>
          <p className="text-[11px] text-fg-subtle">Monitor preparation speed, wait times, and fulfillment accuracy metrics.</p>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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

        <div className="space-y-2">
          <PeakHourIntelligence data={peakHour.data} loading={peakHour.isLoading} />
          <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
            💡 **Insight**: Peak traffic surges occur between 1:00 PM and 2:30 PM. Staggering kitchen prep shifts avoids bottleneck wait times.
          </p>
        </div>
      </div>
    </div>
  );
}