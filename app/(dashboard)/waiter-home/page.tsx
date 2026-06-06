"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { differenceInSeconds, differenceInMinutes, startOfDay } from "date-fns";
import {
  UtensilsCrossed, Clock, ArrowRight, RefreshCw,
  ShoppingCart, BanknoteIcon, Kanban, CreditCard, AlertCircle,
  CheckCircle2, Loader2, Table2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios";
import { extractApiError } from "@/lib/apiError";
import { cn, formatCurrency } from "@/lib/utils";
import type { ApiSuccess, Order } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({ tableNumber, orders, now, onMarkPaid }: {
  tableNumber: string;
  orders: any[];
  now: number;
  onMarkPaid: (orderId: string) => void;
}) {
  const latestOrder = orders[0];
  const elapsed = latestOrder?.createdAt
    ? differenceInSeconds(now, new Date(latestOrder.createdAt))
    : 0;
  const isReady = orders.some((o: any) => o.status === "READY");
  const isPreparing = orders.some((o: any) => o.status === "PREPARING");
  const isNew = orders.every((o: any) => o.status === "NEW");
  const needsPayment = orders.some((o: any) =>
    o.status === "COMPLETED" && o.paymentStatus !== "paid"
  );

  const borderColor = isReady
    ? "border-success/40 shadow-[0_0_12px_rgba(34,197,94,0.1)]"
    : isPreparing
    ? "border-info/40 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
    : isNew
    ? "border-warning/40 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
    : needsPayment
    ? "border-accent/40 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
    : "border-border";

  const statusText = isReady
    ? "Ready to serve"
    : isPreparing
    ? "Preparing"
    : isNew
    ? "New order"
    : needsPayment
    ? "Awaiting payment"
    : "Completed";

  const statusColor = isReady
    ? "text-success"
    : isPreparing
    ? "text-info"
    : isNew
    ? "text-warning"
    : needsPayment
    ? "text-accent"
    : "text-fg-subtle";

  return (
    <div className={cn(
      "flex flex-col gap-3 rounded-xl border-2 bg-surface p-4 transition-all duration-200",
      borderColor,
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Table</div>
          <div className="text-2xl font-black tabular-nums text-fg">{tableNumber}</div>
        </div>
        <div className="text-right">
          <div className={cn("text-[11px] font-semibold", statusColor)}>{statusText}</div>
          <div className="text-[10px] text-fg-subtle num">{fmtElapsed(elapsed)}</div>
        </div>
      </div>

      <div className="space-y-1">
        {orders.slice(0, 2).map((order: any) => (
          <div key={order.id} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-fg-muted font-mono num">#{order.orderNumber}</span>
            <span className="text-[11px] font-semibold text-fg num">{formatCurrency(order.totalAmount ?? 0)}</span>
          </div>
        ))}
        {orders.length > 2 && (
          <p className="text-[10px] text-fg-subtle">+{orders.length - 2} more order{orders.length - 2 !== 1 ? "s" : ""}</p>
        )}
      </div>

      {needsPayment && (
        <button
          onClick={() => onMarkPaid(latestOrder.id)}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent text-[11px] font-semibold hover:bg-accent/25 transition-colors"
        >
          <CreditCard className="h-3.5 w-3.5" />
          Collect Payment
        </button>
      )}
    </div>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────

function QuickAction({ href, label, icon: Icon, accent }: {
  href: string;
  label: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-3",
        "hover:border-border-strong hover:bg-surface-2 transition-all duration-200 active:scale-[0.98]",
      )}
    >
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[13px] font-semibold text-fg">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-fg-subtle ml-auto group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaiterHomePage() {
  const user = useAuthStore((s) => s.user);
  const restaurant = useAuthStore((s) => s.restaurant);
  const queryClient = useQueryClient();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const sessionSeconds = useMemo(() => {
    if (!user?.lastLoginAt) return 0;
    return Math.max(0, differenceInSeconds(now, new Date(user.lastLoginAt)));
  }, [now, user?.lastLoginAt]);

  // Active dine-in orders (for table grid)
  const { data: activeOrders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["waiter-home-active"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/admin/list", {
        params: { limit: 100, status: "NEW,PREPARING,READY,COMPLETED" },
      });
      return (data.data as any[]).filter((o: any) =>
        o.orderType === "DINE_IN" && o.tableNumber
      ) as Order[];
    },
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  // Completed today count
  const { data: completedToday = 0 } = useQuery<number>({
    queryKey: ["waiter-completed-today"],
    queryFn: async () => {
      const from = startOfDay(new Date()).toISOString();
      const { data } = await api.get<any>("/orders/admin/list", {
        params: { limit: 1, page: 1, status: "COMPLETED", from },
      });
      return data.meta?.total ?? 0;
    },
    staleTime: 60_000,
  });

  // Group by table
  const tableGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const order of activeOrders as any[]) {
      const t = order.tableNumber;
      if (!t) continue;
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(order);
    }
    // Sort tables numerically/alphabetically
    return Array.from(map.entries()).sort(([a], [b]) => {
      const na = parseInt(a); const nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [activeOrders]);

  // Pending payment orders
  const pendingPayment = useMemo(() =>
    (activeOrders as any[]).filter((o: any) =>
      o.status === "COMPLETED" && o.paymentStatus !== "paid"
    ),
    [activeOrders]
  );

  // Total pending amount
  const pendingTotal = useMemo(() =>
    pendingPayment.reduce((s: number, o: any) => s + (Number(o.totalAmount) || 0), 0),
    [pendingPayment]
  );

  // Ready orders needing delivery
  const readyToDeliver = useMemo(() =>
    (activeOrders as any[]).filter((o: any) => o.status === "READY"),
    [activeOrders]
  );

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/orders/admin/${id}/pay`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiter-home-active"] });
      toast.success("Order marked as paid");
    },
    onError: (err) => toast.error(extractApiError(err, "Failed to mark as paid")),
  });

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1300px] mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-info/20 bg-gradient-to-br from-info/8 via-surface to-surface p-5 lg:p-6">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-info/5 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info/15 border border-info/25 shadow-[0_0_20px_rgba(59,130,246,0.12)]">
              <UtensilsCrossed className="h-6 w-6 text-info" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-info/70">
                  {restaurant?.name ?? "Restaurant"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-info/25 bg-info/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-info">
                  <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
                  On Floor
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-fg">
                {getGreeting()}, {user?.firstName ?? "there"}.
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[22px] font-black tabular-nums text-fg leading-none">
                {new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
              <div className="text-[10px] text-fg-subtle mt-0.5">
                {new Date(now).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
            <button onClick={() => refetch()} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-info/60">
          <Clock className="h-3 w-3" />
          <span>On shift for <strong className="text-info/90">{fmtDuration(sessionSeconds)}</strong></span>
        </div>
      </div>

      {/* ── Alert banners ─────────────────────────────────────────────────────── */}
      {readyToDeliver.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/8 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0 animate-pulse" />
          <div>
            <p className="text-[13px] font-semibold text-success">
              {readyToDeliver.length} order{readyToDeliver.length !== 1 ? "s" : ""} ready to serve!
            </p>
            <p className="text-[11px] text-success/70">
              {readyToDeliver.map((o: any) => `#${o.orderNumber}${o.tableNumber ? ` (T${o.tableNumber})` : ""}`).join(", ")}
            </p>
          </div>
          <Link href="/orders" className="ml-auto shrink-0 text-[11px] font-semibold text-success underline underline-offset-2">
            View Orders →
          </Link>
        </div>
      )}

      {pendingPayment.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-accent shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-accent">
              {pendingPayment.length} order{pendingPayment.length !== 1 ? "s" : ""} awaiting payment
            </p>
            <p className="text-[11px] text-accent/70">Total pending: {formatCurrency(pendingTotal)}</p>
          </div>
          <Link href="/pay-at-counter" className="ml-auto shrink-0 text-[11px] font-semibold text-accent underline underline-offset-2">
            Pay at Counter →
          </Link>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Tables", value: tableGroups.length, color: "text-info", bg: "bg-info/10 border-info/20 text-info" },
          { label: "Ready to Serve", value: readyToDeliver.length, color: "text-success", bg: "bg-success/10 border-success/20 text-success" },
          { label: "Pending Payment", value: pendingPayment.length, color: "text-accent", bg: "bg-accent/10 border-accent/20 text-accent" },
          { label: "Completed Today", value: completedToday, color: "text-fg-muted", bg: "bg-surface-3 border-border text-fg-muted" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle mb-2">{s.label}</div>
            <div className={cn("text-2xl font-black tabular-nums", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Table Grid + Quick Actions ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* Table Grid */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2/50">
            <Table2 className="h-4 w-4 text-info" />
            <span className="text-[13px] font-semibold text-fg">Table Overview</span>
            <span className="text-[10px] text-fg-subtle bg-surface-3 border border-border rounded-full px-1.5 py-0.5 num ml-1">
              {tableGroups.length} active
            </span>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-surface-2 animate-shimmer" />
                ))}
              </div>
            ) : tableGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Table2 className="h-8 w-8 text-fg-subtle/40" />
                <p className="text-[13px] font-medium text-fg-muted">No active tables</p>
                <p className="text-[11px] text-fg-subtle">All dine-in tables are currently free.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {tableGroups.map(([tableNumber, orders]) => (
                  <TableCard
                    key={tableNumber}
                    tableNumber={tableNumber}
                    orders={orders}
                    now={now}
                    onMarkPaid={(id) => markPaidMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
              {[
                { color: "bg-success", label: "Ready to serve" },
                { color: "bg-info", label: "Preparing" },
                { color: "bg-warning", label: "New order" },
                { color: "bg-accent", label: "Needs payment" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={cn("h-2.5 w-2.5 rounded-full", l.color)} />
                  <span className="text-[10px] text-fg-subtle">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-2/50">
              <span className="text-[13px] font-semibold text-fg">Quick Actions</span>
            </div>
            <div className="p-3 space-y-2">
              <QuickAction href="/orders" label="All Orders" icon={ShoppingCart} accent="bg-info/10 border-info/20 text-info" />
              <QuickAction href="/pay-at-counter" label="Pay at Counter" icon={BanknoteIcon} accent="bg-accent/10 border-accent/20 text-accent" />
              <QuickAction href="/kitchen" label="Kitchen Board" icon={Kanban} accent="bg-warning/10 border-warning/20 text-warning" />
            </div>
          </div>

          {/* Pending payments detail */}
          {pendingPayment.length > 0 && (
            <div className="rounded-xl border border-accent/20 bg-surface overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2/50">
                <span className="text-[12px] font-semibold text-fg">Pending Payments</span>
                <span className="text-[11px] font-bold text-accent num">{formatCurrency(pendingTotal)}</span>
              </div>
              <div className="p-3 space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                {pendingPayment.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-surface-2">
                    <div>
                      <div className="text-[11px] font-semibold text-fg font-mono num">#{order.orderNumber}</div>
                      {order.tableNumber && (
                        <div className="text-[10px] text-fg-subtle">Table {order.tableNumber}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-fg num">{formatCurrency(order.totalAmount ?? 0)}</span>
                      <button
                        onClick={() => markPaidMutation.mutate(order.id)}
                        disabled={markPaidMutation.isPending}
                        className="h-6 px-2 rounded-md bg-accent/15 border border-accent/30 text-accent text-[10px] font-semibold hover:bg-accent/25 transition-colors"
                      >
                        {markPaidMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pay"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
