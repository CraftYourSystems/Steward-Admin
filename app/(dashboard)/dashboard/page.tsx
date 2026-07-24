"use client";

import { useState, useMemo, Suspense, lazy, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  IndianRupee, ShoppingBag, CheckCircle2, XCircle, Clock,
  ArrowRight, RefreshCw, Zap,
} from "lucide-react";
import Link from "next/link";
import { DashboardKpiCard } from "@/components/analytics/DashboardKpiCard";
import { DashboardRecentOrdersTable } from "@/components/analytics/DashboardRecentOrdersTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsSummary, useRevenueData, useTopItems,
} from "@/hooks/useAnalytics";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Lazy-load charts
const DashboardRevenueChart = lazy(() =>
  import("@/components/analytics/DashboardRevenueChart").then((m) => ({ default: m.DashboardRevenueChart }))
);
const DashboardTopItemsChart = lazy(() =>
  import("@/components/analytics/DashboardTopItemsChart").then((m) => ({ default: m.DashboardTopItemsChart }))
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

const ONBOARDING_KEY = "steward-onboarding-dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(ONBOARDING_KEY) === "true"; } catch { return false; }
}

function writeDismissed() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch { /* quota */ }
}

const ChartSkeleton = () => <Skeleton className="h-56 w-full rounded-xl bg-surface-2" />;

export default function DashboardPage() {
  const user       = useAuthStore((s) => s.user);
  const restaurant = useAuthStore((s) => s.restaurant);
  const { wsConnected } = useSettingsStore();
  const queryClient = useQueryClient();

  const [onboardingDismissed, setOnboardingDismissed] = useState(readDismissed);
  const dismissOnboarding = useCallback(() => {
    writeDismissed();
    setOnboardingDismissed(true);
  }, []);

  const [activeRange, setActiveRange] = useState<QuickRange>("30d");
  const params  = useMemo(() => getRange(activeRange), [activeRange]);

  const summary  = useAnalyticsSummary(params, activeRange);
  const revenue  = useRevenueData(params, activeRange);
  const topItems = useTopItems(params, activeRange);

  const menuQuery = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const res = await api.get("/menu/admin/items");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const allTimeOrdersQuery = useQuery({
    queryKey: ["all-time-orders-check"],
    queryFn: async () => {
      const res = await api.get("/orders/admin/list", { params: { limit: 1, page: 1 } });
      return (res.data?.data?.length ?? 0) > 0;
    },
    staleTime: 60_000,
    enabled: !onboardingDismissed,
  });

  const loading        = summary.isLoading || menuQuery.isLoading;
  const d              = summary.data;
  const cancelRate     = d ? d.cancellationRate.toFixed(1) : null;
  const menuItemCount  = (menuQuery.data as any)?.length ?? 0;
  const hasAnyOrders   = allTimeOrdersQuery.data ?? false;

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

  const stepsCompletedCount = (menuItemCount > 0 ? 1 : 0) + (!!restaurant?.slug ? 1 : 0) + (hasAnyOrders ? 1 : 0);
  const isOnboardingComplete = stepsCompletedCount === 3;
  const [onboardingMinimized, setOnboardingMinimized] = useState(false);
  const showOnboarding = !onboardingDismissed && !loading;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-revenue"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-top-items"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-recent-orders-table"] });
    setIsRefreshing(false);
  }, [queryClient]);

  function RangeToggle() {
    return (
      <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveRange(r.value)}
            className={cn(
              "h-7 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer",
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
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-1 border-b border-border">
        <div>
          <div className="label-xs mb-1.5 uppercase tracking-wider">{restaurant?.name ?? "Restaurant"}</div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-fg">
              {getGreeting()}, {user?.firstName ?? "Admin"}.
            </h2>
            {liveActiveCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning animate-pulse shrink-0">
                <Zap className="h-2.5 w-2.5" />
                {liveActiveCount} active
              </span>
            )}
          </div>
          <p className="text-[12px] text-fg-subtle mt-1 num">
            {format(new Date(params.from), "dd MMM")} — {format(new Date(params.to), "dd MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || summary.isFetching}
            title="Refresh analytics"
            className="flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (isRefreshing || summary.isFetching) && "animate-spin")} />
          </button>
          <div className={cn(
            "hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[11px] font-medium",
            wsConnected
              ? "border-success/30 bg-success/10 text-success"
              : "border-border bg-surface text-fg-subtle"
          )}>
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              wsConnected ? "bg-success live-dot" : "bg-fg-subtle"
            )} />
            {wsConnected ? "Live" : "Offline"}
          </div>
          <RangeToggle />
        </div>
      </div>

      {/* Onboarding Checklist */}
      {showOnboarding && (
        <div className="relative rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5">
          {isOnboardingComplete || onboardingMinimized ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-full bg-success/20 border border-success/30 text-success flex items-center justify-center text-[10px] font-bold shrink-0">
                  ✓
                </span>
                <div>
                  <h3 className="text-[13px] font-semibold text-fg">
                    {isOnboardingComplete 
                      ? "Onboarding completed — your restaurant is live!" 
                      : `Onboarding checklist in progress (${stepsCompletedCount}/3 completed)`
                    }
                  </h3>
                  <p className="text-[11px] text-fg-muted mt-0.5">
                    {isOnboardingComplete 
                      ? "All initial setup steps are completed and you're ready to receive orders."
                      : "Complete the remaining steps to get your restaurant up and running."
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setOnboardingMinimized(!onboardingMinimized)}
                  className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  {onboardingMinimized ? "Show Checklist" : "Minimize"}
                </button>
                <button
                  type="button"
                  onClick={dismissOnboarding}
                  className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-[13px] font-semibold text-fg">
                    Welcome — let's get your restaurant live
                  </h3>
                  <p className="text-[11px] text-fg-muted mt-0.5">
                    Three steps and you'll be taking orders.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setOnboardingMinimized(true)}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    Minimize
                  </button>
                  <button
                    type="button"
                    onClick={dismissOnboarding}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
                    aria-label="Dismiss onboarding checklist"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  {
                    label: "Add your first menu item",
                    href:  "/menu",
                    done:  menuItemCount > 0,
                  },
                  {
                    label: "Share your QR code with customers",
                    href:  "/settings?tab=general",
                    done:  !!restaurant?.slug,
                  },
                  {
                    label: "Watch your first order come in",
                    href:  "/orders",
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
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashboardKpiCard title="REVENUE" value={d ? formatCurrency(d.totalRevenue) : "—"} icon={IndianRupee} loading={loading} accent="accent" description={activeRange === "today" ? "today so far" : undefined} />
        <DashboardKpiCard title="ORDERS" value={d ? String(d.totalOrders) : "—"} icon={ShoppingBag} loading={loading} accent="info" />
        <DashboardKpiCard title="COMPLETED" value={d ? String(d.completedOrders) : "—"} icon={CheckCircle2} loading={loading} accent="success" description={d && d.totalOrders > 0 ? `${((d.completedOrders / d.totalOrders) * 100).toFixed(0)}% completion` : undefined} />
        <DashboardKpiCard title="CANCEL RATE" value={cancelRate ? `${cancelRate}%` : "—"} icon={XCircle} loading={loading} accent="danger" />
        <DashboardKpiCard title="AVG PREP TIME" value={d ? `${d.avgPrepTimeMins.toFixed(0)}m` : "—"} icon={Clock} loading={loading} accent="warning" />
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <DashboardRevenueChart data={revenue.data} loading={revenue.isLoading} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <DashboardTopItemsChart data={topItems.data} loading={topItems.isLoading} />
        </Suspense>
      </div>

      {/* Order List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-fg">Order List</h3>
          <RangeToggle />
        </div>

        <DashboardRecentOrdersTable params={params} activeRange={activeRange} />
      </div>
    </div>
  );
}
