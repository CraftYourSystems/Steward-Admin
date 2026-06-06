"use client";

import { useEffect, useMemo, useState, useCallback, memo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsStore } from "@/stores/settings.store";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import { differenceInSeconds } from "date-fns";
import { Check, X, Flame, Clock3, RefreshCw, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { extractApiError } from "@/lib/apiError";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ApiSuccess, Order } from "@/types";

type LaneKey = "NEW" | "PREPARING" | "READY";
const LANES: { key: LaneKey; label: string; accent: string }[] = [
  { key: "NEW",        label: "New",       accent: "text-warning" },
  { key: "PREPARING",  label: "Preparing", accent: "text-info" },
  { key: "READY",      label: "Ready",     accent: "text-success" },
];

function fmtElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function elapsedTone(seconds: number) {
  if (seconds < 5 * 60) return "text-fg-muted";
  if (seconds < 10 * 60) return "text-warning";
  return "text-danger animate-pulse";
}

/** Returns border/glow classes based on urgency */
function urgencyBorder(status: string, seconds: number): string {
  if (status === "NEW") {
    if (seconds >= 10 * 60) return "border-danger/60 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse";
    if (seconds >= 5 * 60)  return "border-warning/50 shadow-[0_0_8px_rgba(245,158,11,0.15)]";
  }
  if (status === "PREPARING" && seconds >= 20 * 60) {
    return "border-danger/50 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse";
  }
  return "border-border";
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine-in", TAKEAWAY: "Takeaway", DELIVERY: "Delivery", COUNTER_PICKUP: "Collect at Counter",
};

/**
 * Memoized order card — avoids re-rendering all cards when `now` ticks.
 * Only re-renders when `order`, `now` (which affects elapsed display), or
 * lane changes. Since `now` updates every 10s (not 1s), renders are 10× fewer.
 */
const KdsOrderCard = memo(function KdsOrderCard({
  order,
  lane,
  now,
  onAdvance,
  onCancel,
}: {
  order: any;
  lane: LaneKey;
  now: number;
  onAdvance: (order: any, to: string, useAdminRoute?: boolean) => void;
  onCancel: (order: any) => void;
}) {
  const elapsed = order.createdAt
    ? differenceInSeconds(now, new Date(order.createdAt))
    : 0;

  const handleAdvancePending = useCallback(() => onAdvance(order, "PREPARING"), [order, onAdvance]);
  const handleAdvancePreparing = useCallback(() => onAdvance(order, "READY"), [order, onAdvance]);
  const handleAdvanceReady = useCallback(() => onAdvance(order, "COMPLETED", true), [order, onAdvance]);
  const handleCancel = useCallback(() => onCancel(order), [order, onCancel]);

  const isUrgent = lane === "NEW" && elapsed >= 10 * 60;
  const isWarning = lane === "NEW" && elapsed >= 5 * 60 && elapsed < 10 * 60;
  const isPrepOverdue = lane === "PREPARING" && elapsed >= 20 * 60;

  return (
    <article className={cn(
      "rounded-lg border bg-surface transition-all overflow-hidden",
      urgencyBorder(lane, elapsed),
    )}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2/50">
        <div className="flex items-center gap-2">
          {(isUrgent || isPrepOverdue) && (
            <AlertTriangle className="h-3 w-3 text-danger shrink-0" />
          )}
          <span className="text-[12px] font-semibold font-mono text-fg num">#{order.orderNumber}</span>
          <span className="text-[10px] uppercase tracking-wider text-fg-subtle font-medium">
            {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
            {order.tableNumber ? ` · T${order.tableNumber}` : ""}
          </span>
          {(isUrgent || isPrepOverdue) && (
            <span className="text-[9px] font-black uppercase tracking-wider text-danger bg-danger/10 border border-danger/30 rounded px-1 py-0.5">
              URGENT
            </span>
          )}
          {isWarning && (
            <span className="text-[9px] font-black uppercase tracking-wider text-warning bg-warning/10 border border-warning/30 rounded px-1 py-0.5">
              SLOW
            </span>
          )}
        </div>
        <div className={cn("flex items-center gap-1 text-[11px] font-semibold num", elapsedTone(elapsed))}>
          <Clock3 className="h-3 w-3" />
          {fmtElapsed(elapsed)}
        </div>
      </header>

      <ul className="divide-y divide-border">
        {(order.items ?? []).map((it: any, i: number) => (
          <li key={i} className="flex items-start gap-2 px-3 py-1.5">
            <span className="mt-0.5 inline-grid h-4 w-4 flex-shrink-0 place-items-center rounded bg-surface-3 border border-border text-[10px] font-semibold text-fg num">
              {it.quantity ?? 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-fg leading-tight">
                {it.menuItem?.name ?? it.name ?? "Item"}
              </div>
              {(it.notes || it.specialInstructions) && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-warning/15 border border-warning/30 px-1.5 py-0.5 text-[10px] font-semibold text-warning leading-tight">
                  ⚡ {it.notes ?? it.specialInstructions}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="px-3 py-1.5 border-t border-border bg-warning/8 flex items-start gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-warning shrink-0">Note</span>
          <span className="text-[11px] text-warning">{order.notes}</span>
        </div>
      )}

      <footer className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-surface-2/30">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-fg num">
            {formatCurrency(order.totalAmount ?? 0)}
          </span>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-wider",
            order.paymentStatus === "paid"
              ? "text-success"
              : order.paymentMethod === "online"
              ? "text-danger animate-pulse"
              : "text-warning"
          )}>
            {order.paymentMethod === "online"
              ? (order.paymentStatus === "paid" ? "Paid Online" : "Unpaid Online")
              : "Pay at Counter"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {lane !== "READY" && (
            <button
              onClick={handleCancel}
              className="h-7 w-7 grid place-items-center rounded-md border border-border text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {lane === "NEW" && (
            <button
              onClick={handleAdvancePending}
              className="h-7 px-2.5 inline-flex items-center gap-1 rounded-md bg-info/15 border border-info/30 text-info text-[11px] font-semibold uppercase tracking-wider hover:bg-info/25 transition-colors"
            >
              Accept
            </button>
          )}
          {lane === "PREPARING" && (
            <button
              onClick={handleAdvancePreparing}
              className="h-7 px-2.5 inline-flex items-center gap-1 rounded-md bg-success/15 border border-success/30 text-success text-[11px] font-semibold uppercase tracking-wider hover:bg-success/25 transition-colors"
            >
              Mark Ready
            </button>
          )}
          {lane === "READY" && (
            <button
              onClick={handleAdvanceReady}
              className="h-7 px-2.5 inline-flex items-center gap-1 rounded-md bg-white text-black text-[11px] font-semibold uppercase tracking-wider hover:bg-white/90 transition-colors"
            >
              <Check className="h-3 w-3" /> Complete
            </button>
          )}
        </div>
      </footer>
    </article>
  );
});

export default function KdsPage() {
  const qc = useQueryClient();
  // 1s interval for accurate MM:SS elapsed timers on kitchen display
  const [now, setNow] = useState(() => Date.now());
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevNewCount = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: [...KITCHEN_ORDERS_QUERY_KEY, "kds"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/admin/list", {
        params: { limit: 100, status: "NEW,PREPARING,READY" },
      });
      return data.data;
    },
    refetchInterval: () => {
      const { wsConnected } = settingsStore.getSnapshot();
      return wsConnected ? false : 15_000;
    },
    structuralSharing: true,
  });

  const orders = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (typeFilter ? orders.filter((o: any) => o.orderType === typeFilter) : orders),
    [orders, typeFilter]
  );

  const lanes = useMemo(() => {
    const map: Record<LaneKey, any[]> = { NEW: [], PREPARING: [], READY: [] };
    filtered.forEach((o: any) => {
      const status = o.status as LaneKey;
      if (map[status]) map[status].push(o);
    });
    return map;
  }, [filtered]);

  // Stable callbacks — don't recreate on every render
  const advance = useCallback(async (order: any, to: string, useAdminRoute = false) => {
    try {
      const route = useAdminRoute
        ? `/orders/admin/${order.id}/status`
        : `/orders/kitchen/${order.id}/status`;
      await api.patch(route, { status: to });
      qc.invalidateQueries({ queryKey: [...KITCHEN_ORDERS_QUERY_KEY, "kds"] });
      qc.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
    } catch (err: any) {
      toast.error(extractApiError(err, "Failed to update order status"));
    }
  }, [qc]);

  const cancel = useCallback(async (order: any) => {
    try {
      await api.patch(`/orders/admin/${order.id}/status`, { status: "CANCELLED" });
      qc.invalidateQueries({ queryKey: [...KITCHEN_ORDERS_QUERY_KEY, "kds"] });
      qc.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
    } catch (err: any) {
      toast.error(extractApiError(err, "Failed to cancel order"));
    }
  }, [qc]);

  // Sound alert for new orders
  useEffect(() => {
    if (!soundEnabled) return;
    const newCount = lanes.NEW.length;
    if (newCount > prevNewCount.current) {
      // Play subtle chime via Web Audio API
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch { /* AudioContext not supported */ }
    }
    prevNewCount.current = newCount;
  }, [lanes.NEW.length, soundEnabled]);

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: [...KITCHEN_ORDERS_QUERY_KEY, "kds"] });
    qc.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
  }, [qc]);

  const urgentCount = lanes.NEW.filter((o: any) => {
    const s = differenceInSeconds(now, new Date(o.createdAt));
    return s >= 5 * 60;
  }).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 lg:px-6 h-12 border-b border-border bg-surface/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-accent" />
            <span className="text-[13px] font-semibold text-fg">Kitchen Display</span>
          </div>
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-danger bg-danger/10 border border-danger/30 rounded-full px-2 py-0.5 animate-pulse">
              <AlertTriangle className="h-2.5 w-2.5" />
              {urgentCount} urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-border bg-surface p-0.5">
            {[
              { v: null, l: "All" },
              { v: "DINE_IN", l: "Dine-in" },
              { v: "TAKEAWAY", l: "Takeaway" },
              { v: "DELIVERY", l: "Delivery" },
              { v: "COUNTER_PICKUP", l: "Counter" },
            ].map((f) => (
              <button
                key={f.l}
                onClick={() => setTypeFilter(f.v)}
                className={cn(
                  "h-6 px-2 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  typeFilter === f.v ? "bg-surface-3 text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                {f.l}
              </button>
            ))}
          </div>
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? "Mute order alerts" : "Enable order alerts"}
            className={cn(
              "h-7 w-7 grid place-items-center rounded-md border transition-colors",
              soundEnabled
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-surface text-fg-muted hover:text-fg"
            )}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
        {LANES.map((lane) => (
          <div key={lane.key} className="bg-bg flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-surface/40">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full bg-current", lane.accent)} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg">{lane.label}</span>
                <span className="text-[11px] text-fg-subtle num">{lanes[lane.key].length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2.5">
              {isLoading ? (
                <div className="text-[11px] text-fg-subtle text-center py-10">Loading…</div>
              ) : lanes[lane.key].length === 0 ? (
                <div className="text-[11px] text-fg-subtle text-center py-10 border border-dashed border-border rounded-lg">
                  No orders
                </div>
              ) : (
                lanes[lane.key].map((order: any) => (
                  <KdsOrderCard
                    key={order.id}
                    order={order}
                    lane={lane.key}
                    now={now}
                    onAdvance={advance}
                    onCancel={cancel}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Sticky footer bar ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 lg:px-6 h-9 border-t border-border bg-surface/60 shrink-0">
        <div className="flex items-center gap-4">
          {[
            { label: "New",       count: lanes.NEW.length,       color: "text-warning" },
            { label: "Preparing", count: lanes.PREPARING.length, color: "text-info" },
            { label: "Ready",     count: lanes.READY.length,     color: "text-success" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={cn("text-[12px] font-black num", l.color)}>{l.count}</span>
              <span className="text-[10px] text-fg-subtle uppercase tracking-wider">{l.label}</span>
            </div>
          ))}
        </div>
        <span className="text-[11px] text-fg-subtle num">{orders.length} total active</span>
      </div>
    </div>
  );
}
