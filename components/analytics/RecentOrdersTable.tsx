"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal, ShoppingBag } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order, ApiSuccess } from "@/types";

interface RecentOrdersTableProps {
  params: { from: string; to: string };
  activeRange: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW:       { label: "New Order",  className: "bg-warning/10 text-warning border-warning/30" },
  PREPARING: { label: "Preparing",  className: "bg-info/10 text-info border-info/30" },
  READY:     { label: "Ready",      className: "bg-success/10 text-success border-success/30" },
  COMPLETED: { label: "Completed",  className: "bg-white/5 text-fg-subtle border-white/10" },
  CANCELLED: { label: "Cancelled",  className: "bg-danger/10 text-danger border-danger/30" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-white/5 text-fg-subtle border-white/10" };
  return (
    <span className={cn(
      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
      config.className
    )}>
      {config.label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="border-b border-white/10 last:border-0">
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
        </tr>
      ))}
    </>
  );
}

export function RecentOrdersTable({ params, activeRange }: RecentOrdersTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-orders-table", params, activeRange],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/admin/list", {
        params: { from: params.from, to: params.to, limit: 15, page: 1 },
      });
      return data.data ?? [];
    },
    staleTime: 60_000,
  });

  const orders = data ?? [];
  const showEmptyState = !isLoading && orders.length === 0;

  return (
    <div className="card-premium overflow-hidden">
      {/* ── Ledger Header ── */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10/40 flex items-center justify-between">
        <span className="text-[12px] uppercase tracking-widest text-fg font-semibold">Ledger</span>
        {!isLoading && orders.length > 0 && (
          <span className="text-[11px] text-fg-subtle">Showing {orders.length} recent transactions</span>
        )}
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2 text-fg-subtle">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-semibold text-fg">No transactions yet</p>
            <p className="text-[12px] text-fg-subtle max-w-xs mx-auto leading-relaxed">
              Once customers scan your QR codes and place orders, live transactions will appear in this ledger.
            </p>
          </div>
          <Link href="/menu" className="mt-2">
            <button className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[12px] font-medium text-fg transition-colors cursor-pointer">
              Set up your Menu
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* ── Block 1: Mobile card list (sm:hidden) ── */}
          <div className="sm:hidden">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg bg-white/5 p-4 space-y-3 animate-pulse">
                    <Skeleton className="h-3 w-24 bg-white/5" />
                    <Skeleton className="h-2 w-full bg-white/5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {orders.map((order: Order) => (
                  <Link
                    key={order.id}
                    href="/orders"
                    className="block rounded-[20px] border border-transparent bg-white/5 p-4
                               hover:border-white/10 hover:bg-white/5 transition-standard group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <span className="font-mono text-[13px] font-semibold text-fg tracking-tight">
                        #{order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-fg-muted font-medium relative z-10">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-border-strong text-fg-muted"></span>
                        {order.tableNumber ? `Table ${order.tableNumber}` : (order.orderType ?? "—")}
                        {" · "}
                        {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold text-fg num tracking-tight">
                        {formatCurrency(order.totalAmount ?? 0)}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Block 2: Desktop table (hidden sm:block) ── */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/30">
                    {["ID", "Date", "Customer", "Location", "Amount", "Status", ""].map((col, i) => (
                      <th key={col} className={`py-3 text-[10px] uppercase tracking-widest text-fg-muted font-semibold ${i === 0 ? 'pl-6' : 'px-3'} ${i === 6 ? 'pr-6 text-right' : ''}`}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {isLoading ? (
                    <TableSkeleton />
                  ) : (
                    orders.map((order: Order) => (
                      <tr key={order.id} className="group hover:bg-white/5/50 transition-colors duration-200 cursor-pointer">
                        <td className="py-3 pl-6 pr-3">
                          <span className="font-mono text-[12px] font-medium text-fg">#{order.orderNumber}</span>
                        </td>
                        <td className="px-3 py-3 text-[12px] text-fg-muted font-medium whitespace-nowrap">
                          {format(new Date(order.createdAt), "MMM d, h:mm a")}
                        </td>
                        <td className="px-3 py-3 text-[12px] text-fg font-medium">
                          {order.customerName ?? "Guest"}
                        </td>
                        <td className="px-3 py-3 text-[12px] text-fg-muted whitespace-nowrap flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-border-strong"></span>
                          {order.tableNumber ? `Table ${order.tableNumber}` : (order.orderType ?? "—")}
                        </td>
                        <td className="px-3 py-3 text-[12px] text-fg font-semibold tabular-nums">
                          {formatCurrency(order.totalAmount ?? 0)}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 pr-6 pl-3 text-right">
                          <Link href="/orders" onClick={(e) => e.stopPropagation()}>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-white/5 text-fg-muted hover:text-fg">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
