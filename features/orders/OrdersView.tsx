"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  PackageSearch,
  RefreshCw,
  Download,
  MoreHorizontal,
  CreditCard,
  Utensils,
  Check,
  ClipboardCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Clock,
  Play,
  CheckCircle,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { extractApiError } from "@/lib/apiError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { hasPermission, Permissions } from "@/lib/permissions/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderFilters as OrderFiltersType, ApiSuccess, PaginationMeta } from "@/types";
import { format } from "date-fns";

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
  COUNTER_PICKUP: "Collect at Counter",
};

function buildParams(filters: OrderFiltersType) {
  const p: Record<string, string | number> = { page: filters.page ?? 1, limit: filters.limit ?? 25 };
  if (filters.status) p.status = filters.status;
  if (filters.orderType) p.orderType = filters.orderType;
  if (filters.from) p.from = filters.from;
  if (filters.to) p.to = filters.to;
  return p;
}

// Helper to calculate elapsed time in minutes
function getElapsedMins(createdAt: string): number {
  const elapsedMs = new Date().getTime() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(elapsedMs / 60000));
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────
function OrdersTableSkeleton({ canMutateStatus }: { canMutateStatus: boolean }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-surface-2 hover:bg-surface-2">
            <TableHead className="h-9 w-8"></TableHead>
            <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Order</TableHead>
            <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Status</TableHead>
            <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Type/Table</TableHead>
            <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Payment</TableHead>
            <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Items</TableHead>
            <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Total</TableHead>
            <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Next Action</TableHead>
            {canMutateStatus && <TableHead className="h-9 w-[40px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, idx) => (
            <TableRow key={idx} className="border-border hover:bg-transparent">
              <TableCell className="py-3"><Skeleton className="h-4 w-4 bg-white/5 rounded" /></TableCell>
              <TableCell className="py-3"><Skeleton className="h-4 w-12 bg-white/5 rounded" /></TableCell>
              <TableCell className="py-3"><Skeleton className="h-5 w-16 bg-white/5 rounded-full" /></TableCell>
              <TableCell className="py-3"><Skeleton className="h-4 w-20 bg-white/5 rounded" /></TableCell>
              <TableCell className="py-3"><Skeleton className="h-5 w-24 bg-white/5 rounded-full" /></TableCell>
              <TableCell className="py-3"><Skeleton className="h-4 w-4 bg-white/5 rounded" /></TableCell>
              <TableCell className="py-3 text-right"><Skeleton className="h-4 w-16 bg-white/5 rounded ml-auto" /></TableCell>
              <TableCell className="py-3"><Skeleton className="h-8 w-28 bg-white/5 rounded" /></TableCell>
              {canMutateStatus && <TableCell className="py-3"><Skeleton className="h-6 w-6 bg-white/5 rounded" /></TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function OrdersView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<OrderFiltersType>({ page: 1, limit: 25 });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Search and sorting state
  const [search, setSearch] = useState("");
  const [completedCollapsed, setCompletedCollapsed] = useState(true);

  const hasActiveFilters = !!(filters.status || filters.orderType || filters.from || filters.to || search);

  const user = useAuthStore((s) => s.user);
  const isKitchenStaff = user?.role === "KITCHEN_STAFF";
  const canMutateStatus = hasPermission(user?.role, Permissions.ORDER_MANAGEMENT) && !isKitchenStaff;

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]> & { meta: PaginationMeta }>(
        "/orders/admin/list",
        { params: buildParams(filters) }
      );
      return data;
    },
  });

  const orders: Order[] = data?.data ?? [];
  const meta = data?.meta;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/orders/admin/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error(extractApiError(error, "Failed to update order status"));
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/orders/admin/${id}/pay`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order marked as paid");
    },
    onError: (error) => {
      toast.error(extractApiError(error, "Failed to mark order as paid"));
    },
  });

  // Client side Search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = search.toLowerCase();
      if (!term) return true;

      const matchesOrderNo = order.orderNumber.toLowerCase().includes(term);
      const matchesCustomer = (order.customerName || "").toLowerCase().includes(term);
      const matchesPhone = (order.customerPhone || "").toLowerCase().includes(term);
      const matchesItems = (order.items ?? []).some((item: any) =>
        (item.menuItem?.name || item.name || "").toLowerCase().includes(term)
      );

      return matchesOrderNo || matchesCustomer || matchesPhone || matchesItems;
    });
  }, [orders, search]);

  // Client side Partition & Priority Sort
  const { activeOrders, completedOrders } = useMemo(() => {
    const active = filteredOrders.filter(
      (o) => o.status === "NEW" || o.status === "PREPARING" || o.status === "READY"
    );
    const completed = filteredOrders.filter(
      (o) => o.status === "COMPLETED" || o.status === "CANCELLED"
    );

    // Active sorting priority: READY -> PREPARING -> NEW
    const statusPriority: Record<string, number> = {
      READY: 1,
      PREPARING: 2,
      NEW: 3,
    };

    const sortedActive = active.sort((a, b) => {
      const pA = statusPriority[a.status] ?? 99;
      const pB = statusPriority[b.status] ?? 99;
      if (pA !== pB) return pA - pB;
      // Sort same-status orders by elapsed time (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Completed sorting: Newest completed/cancelled first
    const sortedCompleted = completed.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { activeOrders: sortedActive, completedOrders: sortedCompleted };
  }, [filteredOrders]);

  const exportCSV = () => {
    if (!orders.length) return;
    const rows = [
      ["Order #", "Status", "Type", "Table", "Payment", "Items", "Total", "Placed"],
      ...orders.map((o: any) => [
        o.orderNumber,
        o.status,
        ORDER_TYPE_LABELS[o.orderType] ?? o.orderType,
        o.tableNumber ?? "",
        o.paymentMethod === "online" ? `Online·${o.paymentStatus}` : "Cash",
        o.items?.length ?? 0,
        o.totalAmount ?? 0,
        o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1.5 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs mb-1">{isKitchenStaff ? "Kitchen" : "Operations"} Workspace</div>
          <h2 className="text-xl font-bold tracking-tight text-fg">Orders Queue</h2>
          {isKitchenStaff && (
            <p className="text-[11px] text-fg-subtle mt-0.5">Read-only queue — manage live statuses on KDS board</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" className="gap-1.5 bg-white/5 hover:bg-white/10 border-white/10" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5 bg-white/5 hover:bg-white/10 border-white/10"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["orders"] })}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Section 1: Operational Summary ── */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[
            {
              label: "Active Queue",
              count: `${orders.filter((o) => ["NEW", "PREPARING"].includes(o.status)).length} Orders`,
              detail: "Awaiting preparation or actively preparing",
              color: "border-warning/30 bg-warning/5 text-warning",
            },
            {
              label: "Ready for Pickup",
              count: `${orders.filter((o) => o.status === "READY").length} Orders`,
              detail: "Completed prep cycle waiting for collection",
              color: "border-success/30 bg-success/5 text-success",
            },
            {
              label: "Average Fulfillment Time",
              count: orders.length > 0
                ? `${Math.round(orders.reduce((acc, o) => acc + (o.estimatedMins || 20), 0) / orders.length)} mins`
                : "0 mins",
              detail: "Average target pace per order",
              color: "border-white/10 bg-white/5 text-fg-muted",
            },
          ].map((card) => (
            <div key={card.label} className={cn("flex flex-col gap-1 p-4 rounded-2xl border transition-all justify-center", card.color)}>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 select-none">
                {card.label}
              </span>
              <span className="text-lg font-black tracking-tight num leading-tight">{card.count}</span>
              <span className="text-[11px] opacity-75 mt-0.5 font-normal leading-none">{card.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
            <input
              type="text"
              placeholder="Search by Order #, Customer name, phone, or item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.status ?? "ALL"}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value === "ALL" ? undefined : e.target.value as any, page: 1 }))}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filters.orderType ?? "ALL"}
              onChange={(e) => setFilters((f) => ({ ...f, orderType: e.target.value === "ALL" ? undefined : e.target.value as any, page: 1 }))}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="DINE_IN">Dine-in</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DELIVERY">Delivery</option>
              <option value="COUNTER_PICKUP">Collect at Counter</option>
            </select>

            <div className="flex items-center gap-1">
              <input
                type="date"
                value={filters.from ? format(new Date(filters.from), "yyyy-MM-dd") : ""}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
                className="h-10 px-2.5 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              />
              <span className="text-[10px] text-fg-subtle">→</span>
              <input
                type="date"
                value={filters.to ? format(new Date(filters.to), "yyyy-MM-dd") : ""}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value ? new Date(e.target.value).toISOString() : undefined, page: 1 }))}
                className="h-10 px-2.5 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-[11px] px-2.5 hover:bg-white/5 text-fg-subtle hover:text-fg"
                onClick={() => {
                  setFilters({ page: 1, limit: filters.limit ?? 25 });
                  setSearch("");
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Active Orders Queue (Primary Workspace) ── */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-fg-subtle select-none">Active Queue</h3>
        
        <div className="card-premium overflow-hidden border border-white/5 rounded-2xl bg-white/[0.01]">
          {isLoading ? (
            <OrdersTableSkeleton canMutateStatus={canMutateStatus} />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-fg-muted">Failed to load active orders.</p>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : orders.length === 0 && !hasActiveFilters ? (
            /* Calm Confirmation Empty State */
            <div className="text-center py-16 bg-success/5 border border-success/15 rounded-2xl p-6">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <h3 className="text-sm font-bold text-success">✓ All caught up</h3>
              <p className="text-xs text-fg-subtle mt-1 font-normal">There are no active orders at the moment.</p>
            </div>
          ) : activeOrders.length === 0 && hasActiveFilters ? (
            /* Search/Filters Empty State */
            <div className="text-center py-12 p-6">
              <h3 className="text-sm font-bold text-fg">No orders match your current filters</h3>
              <p className="text-xs text-fg-subtle mt-1">Try adjusting your search or clearing filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle w-8"></TableHead>
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Order</TableHead>
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Type / Destination</TableHead>
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Elapsed Time</TableHead>
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Total</TableHead>
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Payment</TableHead>
                    {canMutateStatus && <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-center">Next Action</TableHead>}
                    {canMutateStatus && <TableHead className="h-9 w-[40px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOrders.map((order: any) => {
                    const elapsed = getElapsedMins(order.createdAt);
                    
                    // Single Logical Next Action Mapper
                    let primaryAction = null;
                    if (order.status === "NEW") {
                      primaryAction = (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ id: order.id, status: "PREPARING" });
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="bg-info hover:bg-info/95 text-white font-bold text-[11px] h-8 px-4 rounded-lg shrink-0 cursor-pointer w-full transition-transform active:scale-[0.97]"
                        >
                          Start Preparing
                        </Button>
                      );
                    } else if (order.status === "PREPARING") {
                      primaryAction = (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ id: order.id, status: "READY" });
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="bg-success hover:bg-success/95 text-white font-bold text-[11px] h-8 px-4 rounded-lg shrink-0 cursor-pointer w-full transition-transform active:scale-[0.97]"
                        >
                          Mark Ready
                        </Button>
                      );
                    } else if (order.status === "READY") {
                      primaryAction = (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ id: order.id, status: "COMPLETED" });
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="bg-success hover:bg-success/95 text-white font-bold text-[11px] h-8 px-4 rounded-lg shrink-0 cursor-pointer w-full transition-transform active:scale-[0.97]"
                        >
                          Complete Order
                        </Button>
                      );
                    }

                    return (
                      <React.Fragment key={order.id}>
                        <TableRow
                          className={cn(
                            "border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer border-l-2",
                            order.status === "NEW" ? "border-l-warning bg-warning/[0.01]" : order.status === "PREPARING" ? "border-l-info bg-info/[0.01]" : "border-l-success bg-success/[0.01]"
                          )}
                          onClick={() => toggleRow(order.id)}
                        >
                          <TableCell className="py-3 pl-3">
                            {expandedRows.has(order.id)
                              ? <ChevronUp className="h-3.5 w-3.5 text-fg-subtle" />
                              : <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />}
                          </TableCell>
                          <TableCell className="py-3 font-mono text-[12.5px] font-bold text-fg num">
                            #{order.orderNumber}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5">
                              <OrderStatusBadge status={order.status} />
                              {order.status === "NEW" && (
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12.5px] text-fg font-medium">
                                {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                              </span>
                              <span className="text-[10px] text-fg-subtle font-medium">
                                {order.tableNumber ? `Table ${order.tableNumber}` : "Counter Pickup"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[11px] font-bold num",
                              elapsed > 20 ? "text-danger" : elapsed > 12 ? "text-warning" : "text-fg-muted"
                            )}>
                              <Clock className="w-3 h-3" />
                              {elapsed}m
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-right text-[12.5px] font-bold text-fg num">
                            {formatCurrency(order.totalAmount ?? 0)}
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
                              order.paymentStatus === "paid"
                                ? "bg-success/10 text-success border-success/30"
                                : order.paymentMethod === "online"
                                ? "bg-danger/10 text-danger border-danger/30 animate-pulse"
                                : "bg-warning/10 text-warning border-warning/30"
                            )}>
                              {order.paymentMethod === "online"
                                ? `${order.paymentStatus === "paid" ? "Paid" : "Failed"}`
                                : `Cash`}
                            </span>
                          </TableCell>
                          {canMutateStatus && (
                            <TableCell className="py-3 text-center w-[160px]" onClick={(e) => e.stopPropagation()}>
                              {primaryAction}
                            </TableCell>
                          )}
                          {canMutateStatus && (
                            <TableCell className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-white/5">
                                    <MoreHorizontal className="h-4 w-4 text-fg-muted" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px] bg-[#0F0F10] border-white/5">
                                  <DropdownMenuItem
                                    disabled={order.paymentStatus === "paid" || markPaidMutation.isPending}
                                    onClick={() => markPaidMutation.mutate(order.id)}
                                    className={cn("text-[12px] text-fg hover:bg-white/5 focus:bg-white/5", order.paymentStatus === "paid" && "opacity-50")}
                                  >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Mark as Paid</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/5" />
                                  <DropdownMenuItem
                                    disabled={order.status === "PREPARING" || order.status === "READY" || order.status === "COMPLETED" || order.status === "CANCELLED" || updateStatusMutation.isPending}
                                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "PREPARING" })}
                                    className="text-[12px] text-fg hover:bg-white/5 focus:bg-white/5"
                                  >
                                    <Utensils className="mr-2 h-4 w-4" />
                                    <span>Start Preparing</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={order.status === "READY" || order.status === "COMPLETED" || order.status === "CANCELLED" || updateStatusMutation.isPending}
                                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "READY" })}
                                    className="text-[12px] text-fg hover:bg-white/5 focus:bg-white/5"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    <span>Mark Ready</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={order.status === "COMPLETED" || order.status === "CANCELLED" || updateStatusMutation.isPending}
                                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "COMPLETED" })}
                                    className="text-[12px] text-fg hover:bg-white/5 focus:bg-white/5"
                                  >
                                    <ClipboardCheck className="mr-2 h-4 w-4" />
                                    <span>Complete Order</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/5" />
                                  <DropdownMenuItem
                                    disabled={order.status === "CANCELLED" || updateStatusMutation.isPending}
                                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "CANCELLED" })}
                                    className="text-[12px] text-danger focus:text-danger focus:bg-danger/10 hover:bg-danger/5"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    <span>Cancel Order</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>

                        {/* Order Details (Collapsible Drawer pane) */}
                        {expandedRows.has(order.id) && (
                          <TableRow key={`${order.id}-expanded`} className="border-white/5 bg-[#101012] hover:bg-[#101012] transition-colors">
                            <TableCell colSpan={canMutateStatus ? 9 : 7} className="p-4 sm:p-5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[12px] text-fg-muted">
                                {/* Column 1: Items & Notes */}
                                <div className="space-y-3 md:border-r border-white/5 md:pr-4">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Order Items</h4>
                                  <div className="space-y-2">
                                    {(order.items ?? []).map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-start justify-between gap-3 py-1 border-b border-white/[0.03]">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-fg num">{item.quantity}×</span>
                                            <span className="text-fg font-medium">{item.menuItem?.name ?? item.name ?? "Item"}</span>
                                          </div>
                                          {item.notes && (
                                            <div className="text-[10px] text-amber-500/90 mt-0.5 flex items-center gap-1">
                                              <span>⚡</span>
                                              <span>{item.notes}</span>
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-fg-subtle num">
                                          ₹{Number(item.subtotal ?? (item.price * item.quantity)).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {order.notes && (
                                    <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-500/90 space-y-1">
                                      <span className="font-bold uppercase tracking-wider text-[9px]">Special Instructions</span>
                                      <p>{order.notes}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Column 2: Customer & Fulfilment */}
                                <div className="space-y-3 md:border-r border-white/5 md:pr-4">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Customer & Details</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-fg-subtle">Name</span>
                                      <span className="text-fg font-medium">{order.customerName || "Walk-in"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-fg-subtle">Phone</span>
                                      <span className="text-fg font-medium num">{order.customerPhone || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-fg-subtle">Order Type</span>
                                      <span className="text-fg font-medium">{ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-fg-subtle">Table Number</span>
                                      <span className="text-fg font-medium num">{order.tableNumber ?? "—"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 3: Timeline & Pricing */}
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Pricing & Timing</h4>
                                  <div className="space-y-2 border-b border-white/[0.03] pb-2">
                                    <div className="flex justify-between">
                                      <span className="text-fg-subtle">Placed At</span>
                                      <span className="text-fg num">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "—"}</span>
                                    </div>
                                    {order.estimatedMins && (
                                      <div className="flex justify-between">
                                        <span className="text-fg-subtle">Est. Prep Time</span>
                                        <span className="text-fg num">{order.estimatedMins} mins</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-fg-subtle">Subtotal</span>
                                      <span className="text-fg-subtle num">₹{Number(order.subtotal ?? 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] font-bold text-fg pt-1.5 border-t border-white/5">
                                      <span>Total</span>
                                      <span className="num text-accent">{formatCurrency(order.totalAmount ?? 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Completed & Cancelled Orders (Muted Collapsible Queue) ── */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => setCompletedCollapsed(!completedCollapsed)}
          className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-fg-subtle/70 hover:text-fg transition-colors select-none cursor-pointer"
        >
          {completedCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          <span>Completed & Cancelled Work ({completedCollapsed ? completedOrders.length : "Details"})</span>
        </button>

        {!completedCollapsed && (
          <div className="card-premium overflow-hidden border border-white/5 rounded-2xl bg-white/[0.01] opacity-70 hover:opacity-90 transition-opacity">
            {completedOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-fg-subtle italic">
                No completed orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle w-8"></TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Order</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Type / Destination</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Completed Date</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedOrders.map((order: any) => (
                      <React.Fragment key={order.id}>
                        <TableRow
                          className="border-white/5 hover:bg-white/[0.01] cursor-pointer"
                          onClick={() => toggleRow(order.id)}
                        >
                          <TableCell className="py-2.5 pl-3">
                            {expandedRows.has(order.id)
                              ? <ChevronUp className="h-3.5 w-3.5 text-fg-subtle" />
                              : <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />}
                          </TableCell>
                          <TableCell className="py-2.5 font-mono text-[12px] text-fg-muted num">
                            #{order.orderNumber}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="py-2.5 text-[12px] text-fg-muted">
                            {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType} {order.tableNumber ? `(Table ${order.tableNumber})` : ""}
                          </TableCell>
                          <TableCell className="py-2.5 text-[11px] text-fg-subtle num">
                            {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-[12px] font-bold text-fg-muted num">
                            {formatCurrency(order.totalAmount ?? 0)}
                          </TableCell>
                        </TableRow>

                        {/* Collapsed view for completed orders */}
                        {expandedRows.has(order.id) && (
                          <TableRow key={`${order.id}-expanded-completed`} className="border-white/5 bg-[#101012]/40 hover:bg-[#101012]/40 transition-colors">
                            <TableCell colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-fg-muted">
                                <div>
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">Order Items</h4>
                                  <div className="space-y-1">
                                    {(order.items ?? []).map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between">
                                        <span>{item.quantity}× {item.menuItem?.name ?? item.name}</span>
                                        <span className="num">₹{Number(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">Payment Details</h4>
                                  <div className="flex justify-between">
                                    <span>Method</span>
                                    <span className="uppercase">{order.paymentMethod}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Status</span>
                                    <span>{order.paymentStatus}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5 bg-white/[0.01]">
          <span className="text-[11px] text-fg-subtle num">
            Showing {(meta.page - 1) * (filters.limit ?? 25) + 1}–{Math.min(meta.page * (filters.limit ?? 25), meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" disabled={meta.page <= 1}
              onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}>Prev</Button>
            <Button size="sm" variant="secondary" disabled={meta.page >= meta.totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
