"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  IndianRupee, ShoppingBag, CheckCircle2, XCircle, Clock,
  ArrowRight, X, RefreshCw, Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HealthSummary } from "@/components/analytics/HealthSummary";
import { RevenueRing } from "@/components/analytics/RevenueRing";
import { KitchenThroughput } from "@/components/analytics/KitchenThroughput";
import { OrderVelocityHeatmap } from "@/components/analytics/OrderVelocityHeatmap";
import { RecentOrdersTable } from "@/components/analytics/RecentOrdersTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsSummary,
  usePeakHour,
} from "@/hooks/useAnalytics";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  const summary  = useAnalyticsSummary(params, activeRange);
  const peakHourQuery = usePeakHour(params, activeRange);

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

  const stepsCompletedCount = (menuItemCount > 0 ? 1 : 0) + (!!restaurant?.slug ? 1 : 0) + (hasAnyOrders ? 1 : 0);
  const isOnboardingComplete = stepsCompletedCount === 3;
  const [onboardingMinimized, setOnboardingMinimized] = useState(false);

  /**
   * Show onboarding banner when not already dismissed and not still loading.
   */
  const showOnboarding = !onboardingDismissed && !loading;

  // ── Refresh handler ────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    await queryClient.invalidateQueries({ queryKey: ["recent-orders-table"] });
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
    <div className="px-3 py-6 sm:px-5 sm:py-6 lg:px-6 lg:py-8 space-y-8 max-w-[1400px] mx-auto">

      {/* ── 1. Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
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

      {/* ── Live Status Strip ── */}
      {liveActiveCount > 0 && (
        <div className="flex items-center gap-2 card-premium px-4 py-2.5 text-[12px] text-fg-muted">
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

      {/* ── 2. Onboarding Checklist ───────────────────────────────────────────── */}
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

      {/* ── 3. Live Pulse Section ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle"
        >
          Live Pulse
        </motion.p>
        <HealthSummary data={summary.data} loading={loading} activeRange={activeRange} />
      </div>

      {/* ── 4. KPI Cards Section ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RevenueRing current={Number(d?.totalRevenue || 0)} loading={loading} activeRange={activeRange} />
        <KitchenThroughput avgPrepTimeMins={d?.avgPrepTimeMins || 0} loading={loading} />
        <OrderVelocityHeatmap totalOrders={d?.totalOrders || 0} loading={loading} heatmap={peakHourQuery.data?.heatmap} activeRange={activeRange} />
      </div>

      {/* ── 5. Recent Activity Section ───────────────────────────────────────── */}
      <div className="space-y-4">
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3 }}
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle"
        >
          Recent Activity
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        >
          <RecentOrdersTable params={params} activeRange={activeRange} />
        </motion.div>
      </div>
    </div>
  );
}
