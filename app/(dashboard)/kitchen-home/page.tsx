"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { differenceInSeconds, differenceInMinutes, startOfDay } from "date-fns";
import {
  Flame, ChefHat, CheckCircle2, AlertTriangle, Clock,
  Kanban, Soup, ToggleLeft, ArrowRight, RefreshCw, TrendingUp,
  PackageX, Zap,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { cn, formatCurrency } from "@/lib/utils";
import type { ApiSuccess, Order } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
  COUNTER_PICKUP: "Counter",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "text-warning bg-warning/10 border-warning/30",
  PREPARING: "text-info bg-info/10 border-info/30",
  READY: "text-success bg-success/10 border-success/30",
  COMPLETED: "text-fg-subtle bg-surface-2 border-border",
  CANCELLED: "text-danger bg-danger/10 border-danger/30",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, accent, pulse,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  pulse?: boolean;
}) {
  return (
    <div className={cn(
      "relative flex flex-col gap-1 rounded-xl border p-4 transition-all duration-200",
      "bg-surface border-border hover:border-border-strong",
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle">{label}</span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", accent)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={cn("text-2xl font-black tabular-nums leading-none", pulse && Number(value) > 0 && "animate-pulse")}>{value}</span>
      </div>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({
  href, label, description, icon: Icon, accent,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border border-border bg-surface p-4",
        "hover:border-border-strong hover:bg-surface-2 transition-all duration-200",
        "active:scale-[0.98]",
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[13px] font-semibold text-fg">{label}</div>
        <div className="text-[11px] text-fg-subtle mt-0.5">{description}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-fg-subtle ml-auto mt-auto group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({ order, now }: { order: any; now: number }) {
  const elapsed = order.createdAt
    ? differenceInSeconds(now, new Date(order.createdAt))
    : 0;
  const isUrgent = order.status === "NEW" && elapsed > 5 * 60;
  const isOverdue = order.status === "PREPARING" && elapsed > 15 * 60;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
      isUrgent || isOverdue ? "border-danger/30 bg-danger/5" : "border-border bg-surface hover:bg-surface-2",
    )}>
      <span className="text-[12px] font-semibold font-mono text-fg num shrink-0">
        #{order.orderNumber}
      </span>
      <span className="text-[10px] text-fg-subtle shrink-0">
        {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
        {order.tableNumber ? ` · T${order.tableNumber}` : ""}
      </span>
      <span className="text-[10px] text-fg-subtle shrink-0">
        {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
      </span>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <span className={cn(
          "text-[10px] font-semibold tabular-nums",
          isUrgent || isOverdue ? "text-danger" : elapsed > 5 * 60 ? "text-warning" : "text-fg-subtle",
        )}>
          {fmtElapsed(elapsed)}
        </span>
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
          STATUS_COLORS[order.status] ?? "text-fg-subtle bg-surface-2 border-border",
        )}>
          {order.status}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KitchenHomePage() {
  const user = useAuthStore((s) => s.user);
  const restaurant = useAuthStore((s) => s.restaurant);

  const [now, setNow] = useState(() => Date.now());

  // Tick every second for clocks and elapsed timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  // Session duration from lastLoginAt
  const sessionSeconds = useMemo(() => {
    if (!user?.lastLoginAt) return 0;
    return Math.max(0, differenceInSeconds(now, new Date(user.lastLoginAt)));
  }, [now, user?.lastLoginAt]);

  // Live kitchen queue
  const { data: queueOrders = [], isLoading: queueLoading, refetch: refetchQueue } = useQuery<Order[]>({
    queryKey: ["kitchen-home-queue"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/admin/list", {
        params: { limit: 100, status: "NEW,PREPARING,READY" },
      });
      return data.data;
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  // Completed today count
  const { data: completedToday = 0 } = useQuery<number>({
    queryKey: ["kitchen-home-completed-today"],
    queryFn: async () => {
      const from = startOfDay(new Date()).toISOString();
      const { data } = await api.get<ApiSuccess<Order[]> & { meta: { total: number } }>("/orders/admin/list", {
        params: { limit: 1, page: 1, status: "COMPLETED", from },
      });
      return (data as any).meta?.total ?? 0;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Menu items for unavailable count
  const { data: menuItems = [] } = useQuery<any[]>({
    queryKey: ["kitchen-home-menu"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<any[]>>("/menu/admin/items");
      return data.data;
    },
    staleTime: 60_000,
  });

  const activeOrders = useMemo(() => {
    return queueOrders.filter(
      (o: any) => o.status === "NEW" || o.status === "PREPARING" || o.status === "READY"
    );
  }, [queueOrders]);

  const newOrders = useMemo(() => activeOrders.filter((o: any) => o.status === "NEW"), [activeOrders]);
  const preparingOrders = useMemo(() => activeOrders.filter((o: any) => o.status === "PREPARING"), [activeOrders]);
  const readyOrders = useMemo(() => activeOrders.filter((o: any) => o.status === "READY"), [activeOrders]);
  const queueCount = newOrders.length + preparingOrders.length;

  const unavailableCount = useMemo(() => menuItems.filter((i: any) => !i.isAvailable).length, [menuItems]);

  // Urgency detection
  const urgentNew = useMemo(() =>
    newOrders.filter((o: any) => differenceInMinutes(now, new Date(o.createdAt)) >= 5),
    [newOrders, now]
  );
  const overduePrep = useMemo(() =>
    preparingOrders.filter((o: any) => o.startedPreparingAt
      ? differenceInMinutes(now, new Date(o.startedPreparingAt)) >= 15
      : differenceInMinutes(now, new Date(o.createdAt)) >= 20
    ),
    [preparingOrders, now]
  );

  const handleRefresh = useCallback(() => {
    refetchQueue();
  }, [refetchQueue]);

  const roleLabel = user?.role === "KITCHEN_STAFF" ? "Kitchen Staff" : "Waiter";

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1300px] mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#D9B872]/20 bg-gradient-to-br from-[#D9B872]/10 via-surface to-surface p-5 lg:p-6">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#D9B872]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D9B872]/15 border border-[#D9B872]/25 shadow-[0_0_20px_rgba(217,184,114,0.15)]">
              <ChefHat className="h-6 w-6 text-[#D9B872]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D9B872]/70">
                  {restaurant?.name ?? "Restaurant"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D9B872]/25 bg-[#D9B872]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#D9B872]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9B872] animate-pulse" />
                  {roleLabel}
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-fg">
                {getGreeting()}, {user?.firstName ?? "there"}.
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live clock */}
            <div className="text-right">
              <div className="text-[22px] font-black tabular-nums text-fg leading-none">
                {new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
              <div className="text-[10px] text-fg-subtle mt-0.5">
                {new Date(now).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-surface text-[11px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Session timer */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#D9B872]/60">
          <Clock className="h-3 w-3" />
          <span>On shift for <strong className="text-[#D9B872]/90">{fmtDuration(sessionSeconds)}</strong></span>
        </div>
      </div>

      {/* ── Urgency Banners ───────────────────────────────────────────────────── */}
      {urgentNew.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3 animate-pulse">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-warning">
              {urgentNew.length} order{urgentNew.length !== 1 ? "s" : ""} waiting to be accepted
            </p>
            <p className="text-[11px] text-warning/70">
              {urgentNew.map((o: any) => `#${o.orderNumber}`).join(", ")} — over 5 min in queue
            </p>
          </div>
          <Link href="/kds" className="ml-auto shrink-0 text-[11px] font-semibold text-warning hover:text-warning/80 underline underline-offset-2">
            Go to KDS →
          </Link>
        </div>
      )}
      {overduePrep.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/8 px-4 py-3">
          <Flame className="h-4 w-4 text-danger shrink-0 animate-pulse" />
          <div>
            <p className="text-[13px] font-semibold text-danger">
              {overduePrep.length} order{overduePrep.length !== 1 ? "s" : ""} overdue in prep
            </p>
            <p className="text-[11px] text-danger/70">
              {overduePrep.map((o: any) => `#${o.orderNumber}`).join(", ")} — over 15 min preparing
            </p>
          </div>
          <Link href="/kds" className="ml-auto shrink-0 text-[11px] font-semibold text-danger hover:text-danger/80 underline underline-offset-2">
            Go to KDS →
          </Link>
        </div>
      )}

      {/* ── Stats Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="In Queue"
          value={queueLoading ? "…" : queueCount}
          icon={Flame}
          accent="bg-warning/10 border-warning/20 text-warning"
          pulse={queueCount > 5}
        />
        <StatCard
          label="Ready to Serve"
          value={queueLoading ? "…" : readyOrders.length}
          icon={CheckCircle2}
          accent="bg-success/10 border-success/20 text-success"
          pulse={readyOrders.length > 0}
        />
        <StatCard
          label="Completed Today"
          value={completedToday}
          icon={TrendingUp}
          accent="bg-accent/10 border-accent/20 text-accent"
        />
        <StatCard
          label="Items Unavailable"
          value={unavailableCount}
          icon={PackageX}
          accent={unavailableCount > 0 ? "bg-danger/10 border-danger/20 text-danger" : "bg-surface-3 border-border text-fg-subtle"}
        />
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">

        {/* Active Orders Feed */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2/50">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-[13px] font-semibold text-fg">Active Orders</span>
              {!queueLoading && (
                <span className="text-[10px] text-fg-subtle bg-surface-3 border border-border rounded-full px-1.5 py-0.5 num">
                  {activeOrders.length}
                </span>
              )}
            </div>
            <Link href="/kds" className="text-[11px] text-accent hover:text-accent/80 font-medium transition-colors">
              KDS view →
            </Link>
          </div>
          <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
            {queueLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-11 rounded-lg bg-surface-2 animate-shimmer" />
              ))
            ) : activeOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/40" />
                <p className="text-[13px] font-medium text-fg-muted">All clear!</p>
                <p className="text-[11px] text-fg-subtle">No active orders in the queue.</p>
              </div>
            ) : (
              // Sort: urgent first (NEW > PREPARING > READY), then by createdAt
              [...activeOrders]
                .sort((a: any, b: any) => {
                  const priority = { NEW: 0, PREPARING: 1, READY: 2 };
                  const pa = priority[a.status as keyof typeof priority] ?? 3;
                  const pb = priority[b.status as keyof typeof priority] ?? 3;
                  if (pa !== pb) return pa - pb;
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                })
                .map((order: any) => (
                  <OrderRow key={order.id} order={order} now={now} />
                ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2/50">
              <span className="text-[13px] font-semibold text-fg">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              <QuickAction
                href="/kds"
                label="KDS"
                description="Kitchen display"
                icon={Flame}
                accent="bg-warning/10 border-warning/20 text-warning"
              />
              <QuickAction
                href="/kitchen"
                label="Board"
                description="Kanban view"
                icon={Kanban}
                accent="bg-accent/10 border-accent/20 text-accent"
              />
              <QuickAction
                href="/live-counter"
                label="Counter"
                description="Live queue"
                icon={Soup}
                accent="bg-info/10 border-info/20 text-info"
              />
              <QuickAction
                href="/kitchen/availability"
                label="Items"
                description="Availability"
                icon={ToggleLeft}
                accent="bg-success/10 border-success/20 text-success"
              />
            </div>
          </div>

          {/* Lane summary */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle">Lane Summary</span>
            {[
              { label: "New", count: newOrders.length, color: "bg-warning", textColor: "text-warning" },
              { label: "Preparing", count: preparingOrders.length, color: "bg-info", textColor: "text-info" },
              { label: "Ready", count: readyOrders.length, color: "bg-success", textColor: "text-success" },
            ].map((lane) => {
              const total = activeOrders.length || 1;
              const pct = Math.round((lane.count / total) * 100);
              return (
                <div key={lane.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-fg-muted">{lane.label}</span>
                    <span className={cn("text-[11px] font-bold tabular-nums", lane.textColor)}>{lane.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", lane.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
