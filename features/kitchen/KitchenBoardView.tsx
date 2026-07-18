"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import { Flame, ChefHat, CheckCircle2, Clock, Play, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { useKanbanColumns, useKitchenStatusMutation } from "@/hooks/useKitchenOrders";
import { ConnectionStatus } from "@/components/kitchen/layout/ConnectionStatus";
import { ElapsedTimer } from "@/components/kitchen/orders/ElapsedTimer";
import { cn, formatCurrency } from "@/lib/utils";
import { elapsedSeconds, elapsedLevel, formatElapsed } from "@/utils/time";
import type { KitchenOrder, OrderStatus } from "@/types";

// ─── Touch Action Button ────────────────────────────────────────────────────
interface ActionButtonProps {
  order: KitchenOrder;
}

const ActionButton = memo(function ActionButton({ order }: ActionButtonProps) {
  const { mutate, isPending, variables } = useKitchenStatusMutation();

  const handleAction = () => {
    if (order.status === "NEW") {
      mutate({ orderId: order.id, status: "PREPARING" });
    } else if (order.status === "PREPARING") {
      mutate({ orderId: order.id, status: "READY" });
    } else if (order.status === "READY") {
      mutate({ orderId: order.id, status: "COMPLETED" });
    }
  };

  const getLabel = () => {
    if (order.status === "NEW") return "Start Preparing";
    if (order.status === "PREPARING") return "Mark Ready";
    if (order.status === "READY") return "Hand Off";
    return "";
  };

  const getColorClass = () => {
    if (order.status === "NEW") return "bg-info hover:bg-info/95 text-white active:scale-[0.98]";
    if (order.status === "PREPARING") return "bg-success hover:bg-success/95 text-white active:scale-[0.98]";
    if (order.status === "READY") return "bg-success hover:bg-success/95 text-white active:scale-[0.98]";
    return "";
  };

  const isCurrentPending = isPending && variables?.orderId === order.id;

  return (
    <button
      onClick={handleAction}
      disabled={isPending}
      className={cn(
        "w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all cursor-pointer select-none",
        getColorClass()
      )}
    >
      {isCurrentPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <span>{getLabel()}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
});

// ─── Refined Production Ticket Card ──────────────────────────────────────────
interface TicketCardProps {
  order: KitchenOrder;
}

const TicketCard = memo(function TicketCard({ order }: TicketCardProps) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(order.createdAt));

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(elapsedSeconds(order.createdAt));
    }, 5000);
    return () => clearInterval(id);
  }, [order.createdAt]);

  const urgency = elapsedLevel(seconds);

  // Progressive emphasis based on age
  const cardBorderColor = 
    urgency === "urgent" 
      ? "border-danger bg-danger/[0.02]" 
      : urgency === "warning" 
      ? "border-warning bg-warning/[0.01]" 
      : "border-white/10 bg-white/[0.01]";

  const timeLabelSize = 
    urgency === "urgent" 
      ? "text-lg font-black text-danger" 
      : urgency === "warning" 
      ? "text-base font-bold text-warning" 
      : "text-sm font-semibold text-white/50";

  return (
    <article className={cn("rounded-2xl border-l-4 p-4.5 flex flex-col justify-between transition-all space-y-4 hover:bg-white/[0.02]", cardBorderColor)}>
      {/* Ticket Header */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-white/5">
        <div>
          <span className="text-2xl font-black text-white leading-none block">
            #{order.orderNumber}
          </span>
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider block mt-1">
            {order.tableNumber ? `Table ${order.tableNumber}` : "Counter Pickup"}
          </span>
        </div>
        <div className="text-right">
          <div className={cn("font-mono transition-all", timeLabelSize)}>
            {formatElapsed(seconds)}
          </div>
          <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Elapsed</span>
        </div>
      </div>

      {/* Ticket Body: Food Items (Visual Focus) */}
      <div className="space-y-2.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 text-white">
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-base font-black text-accent w-6 shrink-0 leading-tight">
                {item.quantity}×
              </span>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white leading-tight block">
                  {item.name}
                </span>
                {item.notes && (
                  <span className="text-xs text-warning/80 font-medium italic block mt-0.5">
                    {item.notes}
                  </span>
                )}
              </div>
            </div>
            {item.menuItem?.kitchenType && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-white/5 text-white/60 rounded tracking-wide border border-white/5 self-start">
                {item.menuItem.kitchenType}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Special Instructions (Render only when present) */}
      {order.notes && (
        <div className="rounded-lg bg-warning/5 border border-warning/15 px-3 py-2 text-[12.5px] text-warning font-semibold">
          <div className="text-[9px] font-black uppercase tracking-wider text-warning/80 mb-0.5">Special Instructions</div>
          <p className="leading-relaxed">{order.notes}</p>
        </div>
      )}

      {/* Touch Action footer */}
      <div className="pt-2 border-t border-white/5">
        <ActionButton order={order} />
      </div>
    </article>
  );
});

// ─── Kanban Column ──────────────────────────────────────────────────────────
interface ColumnProps {
  title: string;
  icon: React.ReactNode;
  orders: KitchenOrder[];
  accentColor: string;
  emptyText: string;
  isLoading: boolean;
}

const Column = memo(function Column({ title, icon, orders, accentColor, emptyText, isLoading }: ColumnProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-white/[0.05] last:border-r-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2 select-none">
          {icon}
          <span className="text-[13px] font-extrabold uppercase tracking-widest" style={{ color: accentColor }}>
            {title}
          </span>
        </div>
        {orders.length > 0 && (
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            {orders.length}
          </span>
        )}
      </div>

      {/* Tickets Scrollport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="h-44 bg-white/[0.02] rounded-2xl border border-white/5 animate-pulse" />
          ))
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-center select-none">
            <span className="text-xs text-white/30 italic font-medium">{emptyText}</span>
          </div>
        ) : (
          orders.map((o) => (
            <TicketCard key={o.id} order={o} />
          ))
        )}
      </div>
    </div>
  );
});

// ─── Main Kitchen Board View ────────────────────────────────────────────────
export function KitchenBoardView() {
  const { newOrders = [], preparingOrders = [], readyOrders = [], isLoading } = useKanbanColumns();

  // Dynamic calculations for compact header status
  const totalInProgress = preparingOrders.length;
  const totalReady = readyOrders.length;

  const avgPrepMins = useMemo(() => {
    const active = [...preparingOrders, ...readyOrders];
    if (active.length === 0) return 0;
    const totalElapsedSecs = active.reduce((acc, o) => acc + elapsedSeconds(o.createdAt), 0);
    return Math.round(totalElapsedSecs / active.length / 60);
  }, [preparingOrders, readyOrders]);

  const isKitchenClear = newOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0b] text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] shrink-0">
        <div>
          <h1 className="text-[13px] font-bold text-white/50 uppercase tracking-widest select-none">
            Production Line
          </h1>
          <p className="text-[11px] text-white/30 mt-0.5 select-none">Real-time KDS Board console.</p>
        </div>
        <ConnectionStatus />
      </div>

      {/* ── Kitchen Status Header ── */}
      <div className="shrink-0 grid grid-cols-3 gap-4 p-4 border-b border-white/[0.05] bg-black/20">
        {[
          { label: "Tickets In Progress", val: `${totalInProgress}`, color: "text-info" },
          { label: "Ready to Serve", val: `${totalReady}`, color: "text-success" },
          { label: "Average Prep Time", val: `${avgPrepMins} min`, color: "text-warning" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 justify-center pl-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/40 select-none">{stat.label}</span>
            <span className={cn("text-lg font-black tracking-tight", stat.color)}>{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Production Board */}
      <div className="flex-1 overflow-hidden min-h-0">
        {isKitchenClear && !isLoading ? (
          /* Entire Kitchen Clear Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
            <CheckCircle className="h-10 w-10 text-success animate-pulse" />
            <h3 className="text-base font-bold text-success">✓ Kitchen is clear</h3>
            <p className="text-xs text-white/45 max-w-sm">There are no active tickets at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full overflow-hidden">
            <Column
              title="Received"
              icon={<Flame className="h-4 w-4 text-[#D9B872]" />}
              orders={newOrders}
              accentColor="#D9B872"
              emptyText="✓ No new tickets waiting."
              isLoading={isLoading}
            />
            <Column
              title="Preparing"
              icon={<ChefHat className="h-4 w-4 text-[#C8B6E2]" />}
              orders={preparingOrders}
              accentColor="#C8B6E2"
              emptyText="✓ Nothing is currently being prepared."
              isLoading={isLoading}
            />
            <Column
              title="Ready"
              icon={<CheckCircle2 className="h-4 w-4 text-[#92B9A5]" />}
              orders={readyOrders}
              accentColor="#92B9A5"
              emptyText="✓ No completed dishes waiting for pickup."
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
