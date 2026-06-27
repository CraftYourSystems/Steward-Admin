"use client";

import { useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  IndianRupee, ShoppingBag, CheckCircle2, XCircle, Clock,
  ArrowRight, X, RefreshCw, Zap,
} from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/analytics/KpiCard";
import type { AnalyticsSummary } from "@/types";
import { RecentOrdersTable } from "@/components/analytics/RecentOrdersTable";
import { TodaysInsights } from "@/components/analytics/TodaysInsights";
import { BestWorstSellers } from "@/components/analytics/BestWorstSellers";
import { PeakHourIntelligence } from "@/components/analytics/PeakHourIntelligence";
import { HealthScoreCard } from "@/components/analytics/HealthScoreCard";
import { ItemCombinations } from "@/components/analytics/ItemCombinations";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsSummary, useRevenueData, useTopItems,
  useTodaysInsights, useItemPerformance, usePeakHour,
  useHealthScore, useItemCombinations,
} from "@/hooks/useAnalytics";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Persist onboarding dismissal in localStorage so it survives page reloads.
const ONBOARDING_KEY = "steward-onboarding-dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(ONBOARDING_KEY) === "true"; } catch { return false; }
}

function writeDismissed() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch { /* quota */ }
}

const ChartSkeleton = () => <Skeleton className="h-48 sm:h-56 w-full rounded-xl bg-surface-2" />;

export default function DashboardPage() {
  const user       = useAuthStore((s) => s.user);
  const restaurant = useAuthStore((s) => s.restaurant);
  const { wsConnected } = useSettingsStore();
  const queryClient = useQueryClient();

  // ORDER_CREATED toast notification is handled by useSocket({ enabled: isAdmin && isDashboard })
  // called in the dashboard layout — no duplicate listener needed here (FIX 7.5).

  // ── Onboarding: persisted dismissal ───────────────────────────────────────
  // Initialise synchronously from localStorage so there's no flash.
  const [onboardingDismissed, setOnboardingDismissed] = useState(readDismissed);

  const dismissOnboarding = useCallback(() => {
    writeDismissed();
    setOnboardingDismissed(true);
  }, []);

  // ── Date range ─────────────────────────────────────────────────────────────
  // Default to "today" so the live dashboard is the first thing admins see.
  const [activeRange, setActiveRange] = useState<QuickRange>("today");
  const params  = useMemo(() => getRange(activeRange), [activeRange]);

  // Pass activeRange to hooks so they can use a shorter staleTime + auto-poll.
  const summary          = useAnalyticsSummary(params, activeRange);
  const revenue          = useRevenueData(params, activeRange);
  const topItems         = useTopItems(params, activeRange);
  const insights         = useTodaysInsights();
  const itemPerformance  = useItemPerformance(params, activeRange);
  const peakHour         = usePeakHour(params, activeRange);
  const healthScore      = useHealthScore();
  const combinations     = useItemCombinations(params, activeRange);

  // ── Menu items (for onboarding check) ─────────────────────────────────────
  const menuQuery = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const res = await api.get("/menu/admin/items");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  /**
   * All-time orders check — range-independent.
   *
   * Bug fixed: previously `orderCount` came from the date-range analytics
   * summary, so switching to "today" with zero orders (but past orders
   * existing) would re-show the onboarding banner incorrectly.
   * Now we do a single, separate query that isn't tied to the active range.
   */
  const allTimeOrdersQuery = useQuery({
    queryKey: ["all-time-orders-check"],
    queryFn: async () => {
      const res = await api.get("/orders/admin/list", { params: { limit: 1, page: 1 } });
      return (res.data?.data?.length ?? 0) > 0;
    },
    staleTime: 60_000,
    // Skip fetching if the user has already dismissed the banner.
    enabled: !onboardingDismissed,
  });

  const loading        = summary.isLoading || menuQuery.isLoading;
  const d              = summary.data;
  const cancelRate     = d ? d.cancellationRate.toFixed(1) : null;
  const menuItemCount  = (menuQuery.data as any)?.length ?? 0;
  const hasAnyOrders   = allTimeOrdersQuery.data ?? false;

  // Live active order count (for header badge)
  const { data: liveActiveCount = 0 } = useQuery<number>({
    queryKey: ["dashboard-live-active-count"],
    queryFn: async () => {
      const { data } = await api.get<any>("/orders/admin/list", {
        params: { limit: 1, page: 1, status: "NEW,PREPARING" },
      });
      return data.meta?.total ?? 0;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });



  /**
   * Show onboarding banner only when:
   * 1. Not already dismissed.
   * 2. Not still loading.
   * 3. The restaurant has NO menu items yet.
   * (we don't hide it just because there are no orders in the active date range)
   */
  const showOnboarding = !onboardingDismissed && !loading && menuItemCount === 0;

  // ── Refresh handler ────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-revenue"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-top-items"] }),
      queryClient.invalidateQueries({ queryKey: ["recent-orders-table"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-insights"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-item-performance"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-peak-hour"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-health-score"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics-combinations"] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  function RangeToggle() {
    return (
      <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveRange(r.value)}
            className={cn(
              "h-7 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-150",
              activeRange === r.value
                ? "bg-surface-3 text-fg border border-border-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border">
        <div className="min-w-0">
          <div className="label-xs mb-1">{restaurant?.name ?? "Restaurant"}</div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-fg truncate">
              {getGreeting()}, {user?.firstName ?? "there"}.
            </h2>
            {liveActiveCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning animate-pulse shrink-0">
                <Zap className="h-2.5 w-2.5" />
                {liveActiveCount} active
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || summary.isFetching}
            title="Refresh analytics"
            className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (isRefreshing || summary.isFetching) && "animate-spin")} />
          </button>
          <RangeToggle />
        </div>
      </div>

      {/* ── Live Status Strip ────────────────────────────────────────────────
           Renders only when there are active orders in the kitchen.
      ──────────────────────────────────────────────────────────────────────── */}
      {liveActiveCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-[12px] text-fg-muted">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span>
            <span className="font-semibold text-fg">{liveActiveCount}</span>
            {" "}active {liveActiveCount === 1 ? "order" : "orders"} in kitchen right now
          </span>
          <Link
            href="/orders"
            className="ml-auto text-[11px] text-accent hover:underline underline-offset-2"
          >
            View →
          </Link>
        </div>
      )}

      {/* ── Onboarding Checklist ─────────────────────────────────────────────
           Only shown for brand-new restaurants (no menu items yet).
           Dismissal is persisted in localStorage so it never reappears.
      ──────────────────────────────────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="relative mb-2 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <button
            type="button"
            onClick={dismissOnboarding}
            className="absolute right-3 top-3 rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            aria-label="Dismiss onboarding checklist"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="text-[13px] font-semibold text-fg mb-1">
            Welcome — let&apos;s get your restaurant live
          </h3>
          <p className="text-[12px] text-fg-muted mb-4">
            Three steps and you&apos;ll be taking orders.
          </p>
          <div className="space-y-2">
            {[
              {
                label: "Add your first menu item",
                href:  "/menu",
                // Done when there's at least one menu item.
                done:  menuItemCount > 0,
              },
              {
                label: "Share your QR code with customers",
                href:  "/settings?tab=general",
                // Done when the restaurant has a slug (QR setup complete).
                done:  !!restaurant?.slug,
              },
              {
                label: "Watch your first order come in",
                href:  "/orders",
                // Done when there are orders in any time range — range-independent.
                done:  hasAnyOrders,
              },
            ].map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 hover:bg-surface-2 transition-colors group"
              >
                <span className={cn(
                  "h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0",
                  step.done
                    ? "bg-success border-success/30 text-white"
                    : "border-border text-fg-subtle"
                )}>
                  {step.done ? "✓" : i + 1}
                </span>
                <span className={cn(
                  "text-[13px] font-medium",
                  step.done ? "line-through text-fg-subtle" : "text-fg"
                )}>
                  {step.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-fg-subtle ml-auto group-hover:text-fg transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Section label ─────────────────────────────────────────────────── */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        Performance
      </p>

      {/* ── KPI Cards — Mobile (sm:hidden) ──────────────────────────────────
           Revenue is full-width hero; remaining 4 are a horizontal scroll strip.
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {/* Revenue — full-width hero */}
        <KpiCard
          title="Revenue"
          value={d ? formatCurrency(d.totalRevenue) : "₹0.00"}
          icon={IndianRupee}
          loading={loading}
          accent="accent"
          size="lg"
          description={activeRange === "today" ? "today so far" : undefined}
        />
        {/* Horizontal scroll row for secondary KPIs */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-3 px-3 pb-2 [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[148px] snap-start shrink-0">
            <KpiCard
              title="Orders"
              value={d ? String(d.totalOrders) : "0"}
              icon={ShoppingBag}
              loading={loading}
              accent="info"
            />
          </div>
          <div className="min-w-[148px] snap-start shrink-0">
            <KpiCard
              title="Completed"
              value={d ? String(d.completedOrders) : "0"}
              icon={CheckCircle2}
              loading={loading}
              accent="success"
              description={
                d && d.totalOrders > 0
                  ? `${((d.completedOrders / d.totalOrders) * 100).toFixed(0)}% completion`
                  : undefined
              }
            />
          </div>
          <div className="min-w-[148px] snap-start shrink-0">
            <KpiCard
              title="Cancel Rate"
              value={cancelRate ? `${cancelRate}%` : "0.0%"}
              icon={XCircle}
              loading={loading}
              accent="danger"
              alertWhen={(v) => parseFloat(v) > 10}
            />
          </div>
          <div className="min-w-[148px] snap-start shrink-0">
            <KpiCard
              title="Avg Prep Time"
              value={d ? `${d.avgPrepTimeMins.toFixed(0)}m` : "0m"}
              icon={Clock}
              loading={loading}
              accent="warning"
            />
          </div>
        </div>
      </div>

      {/* ── KPI Cards — sm and above (hidden on mobile) ──────────────────────
           5-column grid identical to what was there before.
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="hidden sm:grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Revenue"
          value={d ? formatCurrency(d.totalRevenue) : "₹0.00"}
          icon={IndianRupee}
          loading={loading}
          accent="accent"
          description={activeRange === "today" ? "today so far" : undefined}
        />
        <KpiCard
          title="Orders"
          value={d ? String(d.totalOrders) : "0"}
          icon={ShoppingBag}
          loading={loading}
          accent="info"
        />
        <KpiCard
          title="Completed"
          value={d ? String(d.completedOrders) : "0"}
          icon={CheckCircle2}
          loading={loading}
          accent="success"
          description={
            d && d.totalOrders > 0
              ? `${((d.completedOrders / d.totalOrders) * 100).toFixed(0)}% completion`
              : undefined
          }
        />
        <KpiCard
          title="Cancel Rate"
          value={cancelRate ? `${cancelRate}%` : "0.0%"}
          icon={XCircle}
          loading={loading}
          accent="danger"
          alertWhen={(v) => parseFloat(v) > 10}
        />
        <KpiCard
          title="Avg Prep Time"
          value={d ? `${d.avgPrepTimeMins.toFixed(0)}m` : "0m"}
          icon={Clock}
          loading={loading}
          accent="warning"
        />
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

      {/* ── Section label ─────────────────────────────────────────────────── */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        Recent Activity
      </p>

      {/* ── Order List ─────────────────────────────────────────────────────── */}
      <RecentOrdersTable params={params} activeRange={activeRange} />
    </div>
  );
}
