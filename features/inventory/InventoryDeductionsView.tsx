"use client";

import React, { useState } from "react";
import {
  useDeductionDashboard,
  useToggleStrictMode,
  useResolveAlert,
  DeductionLogEntry,
  InventoryAlertEntry,
} from "@/hooks/useInventoryDeductions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Search,
  Check,
  AlertOctagon,
  TrendingDown,
  FileText,
  Settings,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

export function InventoryDeductionsView() {
  const { data: dashboard, isLoading, refetch } = useDeductionDashboard();
  const toggleStrictModeMutation = useToggleStrictMode();
  const resolveAlertMutation = useResolveAlert();

  const [search, setSearch] = useState("");

  const handleToggleStrict = async (checked: boolean) => {
    try {
      await toggleStrictModeMutation.mutateAsync(checked);
      toast.success(checked ? "Strict inventory policy enabled" : "Flexible inventory policy enabled");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update strict policy");
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlertMutation.mutateAsync(alertId);
      toast.success("Alert resolved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resolve alert");
    }
  };

  const filteredLogs = React.useMemo(() => {
    if (!dashboard) return [];
    if (!search) return dashboard.logs;
    const lower = search.toLowerCase();
    return dashboard.logs.filter(
      (l: DeductionLogEntry) =>
        l.orderId.toLowerCase().includes(lower) ||
        l.ingredientName.toLowerCase().includes(lower) ||
        l.menuItemName.toLowerCase().includes(lower)
    );
  }, [dashboard, search]);

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Stock Automation</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Automatic Deductions</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Real-time monitoring of POS order-completion stock deductions, alerts, policy parameters, and system logs.
          </p>
        </div>

        {/* Strict Mode Toggle */}
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-fg flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" /> Strict Negative Stock Mode
            </span>
            <span className="text-[10px] text-fg-subtle mt-0.5">Reject orders with insufficient stock</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-10 bg-white/5" />
          ) : (
            <Switch
              checked={dashboard?.strictMode || false}
              onCheckedChange={handleToggleStrict}
              disabled={toggleStrictModeMutation.isPending}
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Today's Deductions</span>
          {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">{dashboard?.totalDeductions || 0}</span>}
        </div>

        <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Failed Deductions</span>
          {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-danger mt-1.5">{dashboard?.failedDeductions || 0}</span>}
        </div>

        <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Missing Recipes</span>
          {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-warning mt-1.5">{dashboard?.missingRecipesCount || 0}</span>}
        </div>

        <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Low Stock Alerts</span>
          {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-warning mt-1.5">{dashboard?.lowStockCount || 0}</span>}
        </div>

        <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Negative Stock Events</span>
          {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-danger mt-1.5">{dashboard?.negativeStockCount || 0}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Stream Panel */}
        <div className="lg:col-span-1 border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Active System Alerts
            </h3>
            <button onClick={() => refetch()} className="text-fg-subtle hover:text-fg text-xs p-1">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {isLoading ? (
              <Skeleton className="h-40 w-full bg-white/5" />
            ) : !dashboard || dashboard.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-fg-subtle">
                <CheckCircle className="w-7 h-7 text-success mb-2 opacity-80" />
                <span className="font-semibold text-fg">No Active Alerts</span>
                <span className="text-[10px] text-fg-subtle mt-0.5">Stock deduction logs are functioning normally.</span>
              </div>
            ) : (
              dashboard.alerts.map((alert: InventoryAlertEntry) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 rounded-xl border space-y-2 text-xs",
                    alert.severity === "CRITICAL"
                      ? "bg-danger/10 border-danger/25 text-danger"
                      : alert.severity === "ERROR"
                      ? "bg-danger/10 border-danger/25 text-danger"
                      : "bg-warning/10 border-warning/25 text-warning"
                  )}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="flex items-center gap-1.5">
                      {alert.severity === "CRITICAL" ? (
                        <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="font-bold uppercase tracking-wider text-[9px] px-1 py-0.5 rounded bg-white/10">
                        {alert.type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-[10px] hover:underline font-bold text-fg-muted hover:text-fg cursor-pointer flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" /> Dismiss
                    </button>
                  </div>
                  <p className="leading-relaxed font-medium text-[11px]">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log Table Panel */}
        <div className="lg:col-span-2 border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Deduction Audit Log
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
              <input
                type="text"
                placeholder="Filter by Order or Ingredient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-9 pr-3 text-xs bg-[#141416] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle"
              />
            </div>
          </div>

          <div className="border border-white/5 rounded-xl bg-[#09090A] overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-full bg-white/5" />
                <Skeleton className="h-6 w-full bg-white/5" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-fg-subtle">
                No stock deduction transactions logged today.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                      <TableHead className="h-8 text-[9px] text-fg-subtle">Order ID</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle">MenuItem</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle">Ingredient</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle w-16 text-right">Qty</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle w-24 text-right">Stock Variance</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: DeductionLogEntry) => (
                      <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.01]">
                        <TableCell className="py-2 font-mono text-[10px] text-fg font-medium">
                          #{log.orderId.substring(0, 8)}
                        </TableCell>
                        <TableCell className="py-2 text-[10px] text-fg-muted font-medium">
                          {log.menuItemName} {log.recipeVersion ? `(v${log.recipeVersion})` : ""}
                        </TableCell>
                        <TableCell className="py-2 text-[10px] text-fg-muted font-medium">
                          {log.ingredientName}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-[10px] text-fg-subtle">
                          -{log.quantity.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-[10px] text-fg-subtle">
                          {log.previousStock.toFixed(2)} → {log.newStock.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <Badge
                            className={cn(
                              "text-[8px] font-bold px-1 rounded",
                              log.status === "SUCCESS" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                            )}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
