"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order, ApiSuccess } from "@/types";

interface DashboardRecentOrdersTableProps {
  params: { from: string; to: string };
  activeRange: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW:       { label: "New Order",  className: "bg-warning/10 text-warning border-warning/30" },
  PREPARING: { label: "Preparing",  className: "bg-info/10 text-info border-info/30" },
  READY:     { label: "Ready",      className: "bg-success/10 text-success border-success/30" },
  COMPLETED: { label: "Completed",  className: "bg-surface-2 text-fg-subtle border-border" },
  CANCELLED: { label: "Cancelled",  className: "bg-danger/10 text-danger border-danger/30" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-surface-2 text-fg-subtle border-border" };
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
        <tr key={i} className="border-b border-border last:border-0">
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

export function DashboardRecentOrdersTable({ params, activeRange }: DashboardRecentOrdersTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-recent-orders-table", params, activeRange],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/admin/list", {
        params: { from: params.from, to: params.to, limit: 15, page: 1 },
      });
      return data.data ?? [];
    },
    staleTime: 60_000,
  });

  const orders = data ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["No", "ID", "Date", "Customer Name", "Location", "Amount", "Status", "Action"].map((col, i) => (
                <th key={col} className={cn("label-xs uppercase tracking-wider pb-3", i === 0 ? "pl-3" : "px-3")}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <TableSkeleton />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-[12px] text-fg-subtle">
                  No orders in this period
                </td>
              </tr>
            ) : (
              orders.map((order: Order, idx: number) => (
                <tr key={order.id} className="group hover:bg-surface-2 transition-colors duration-200 cursor-pointer">
                  <td className="px-3 py-2.5 text-[12px] text-fg-subtle tabular-nums">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12px] font-medium text-fg">#{order.orderNumber}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted whitespace-nowrap">
                    {format(new Date(order.createdAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg font-medium">
                    {order.customerName ?? "Guest"}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted whitespace-nowrap flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-border-strong"></span>
                    {order.tableNumber ? `Table ${order.tableNumber}` : (order.orderType ?? "—")}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg font-semibold tabular-nums">
                    {formatCurrency(order.totalAmount ?? 0)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2.5 pr-6">
                    <Link href="/orders" onClick={(e) => e.stopPropagation()}>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surface-3 text-fg-muted hover:text-fg">
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
  );
}
