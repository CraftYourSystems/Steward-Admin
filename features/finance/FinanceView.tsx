"use client";

import React, { useState, useMemo } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Percent,
  Receipt,
  Layers,
  ArrowRight,
  ShieldAlert,
  Wallet,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/analytics/KpiCard";
import { useFinanceSummary, useFinanceTrend } from "@/hooks/useFinanceAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type QuickRange = "30d" | "90d" | "180d";
const ISO = (d: Date) => d.toISOString();

function getRange(range: QuickRange) {
  const now = new Date();
  switch (range) {
    case "30d":
      return { from: ISO(startOfDay(subDays(now, 29))), to: ISO(endOfDay(now)) };
    case "90d":
      return { from: ISO(startOfDay(subDays(now, 89))), to: ISO(endOfDay(now)) };
    case "180d":
    default:
      return { from: ISO(startOfDay(subDays(now, 179))), to: ISO(endOfDay(now)) };
  }
}

export function FinanceView() {
  const [activeRange, setActiveRange] = useState<QuickRange>("30d");
  const [activeTab, setActiveTab] = useState<string>("summary");
  const params = useMemo(() => getRange(activeRange), [activeRange]);

  const summary = useFinanceSummary(params);
  const trend = useFinanceTrend({ ...params, interval: "daily" });

  const data = summary.data;

  // Real backend metrics
  const totalRev = data?.revenue ?? 0;
  const todayRev = data?.todayRevenue ?? 0;
  const todayOrders = data?.todayOrderCount ?? 0;
  const grossSales = data?.grossSales ?? 0;
  const netSales = data?.netSales ?? 0;
  const avgOrderVal = data?.avgOrderValue ?? 0;
  const outstandingRec = data?.outstandingReceivables ?? 0;
  const totalRefunds = data?.totalRefunds ?? 0;
  const totalOrders = data?.totalOrders ?? 0;
  const cancelledOrders = data?.cancelledOrders ?? 0;
  const avgItemsPerTicket = data?.avgItemsPerTicket ?? 0;

  // Real Food / Labor cost percentages (or null)
  const foodCostPct = data?.foodCostPct ?? null;
  const laborCostPct = data?.laborCostPct ?? null;

  // Derived Business Health Check based on real metrics
  const { businessHealth, healthReason } = useMemo(() => {
    if (!data || data.totalOrders === 0) {
      return { businessHealth: "Stable", healthReason: "No transaction history recorded yet." };
    }
    const growth = data.revenueGrowth ?? 0;
    const primeCost = (foodCostPct ?? 0) + (laborCostPct ?? 0);

    const isHealthy = growth >= 5 && (primeCost > 0 ? primeCost <= 60 : true);
    const isNeedsAttention = growth < 0 || (primeCost > 65);
    const status = isHealthy ? "Healthy" : isNeedsAttention ? "Needs Attention" : "Stable";

    let reason = "Margins and revenues remain inside target operating ranges.";
    if (status === "Healthy") {
      reason = `Sales are up ${growth}% vs previous period.`;
    } else if (status === "Needs Attention") {
      reason = `Sales growth is ${growth}% and operational cost ratio is high.`;
    }

    return { businessHealth: status, healthReason: reason };
  }, [data, foodCostPct, laborCostPct]);

  const renderGauge = (label: string, valuePct: number | null, message?: string) => {
    if (valuePct === null) {
      return (
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-center items-center h-[140px]">
          <h3 className="text-[12px] font-bold text-fg-subtle uppercase tracking-wider mb-2">{label} Ratio</h3>
          <p className="text-[10px] text-warning border border-warning/20 bg-warning/10 px-2.5 py-0.5 rounded-full uppercase font-semibold">
            {message || "Not Available"}
          </p>
          <span className="text-[10px] text-fg-subtle mt-1.5 font-normal">Data awaiting cost entries</span>
        </div>
      );
    }

    const isGood = valuePct >= 28 && valuePct <= 35;
    const isHigh = valuePct > 35;
    const color = isGood ? "text-success" : isHigh ? "text-danger" : "text-warning";

    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between h-[140px]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-[12px] font-bold text-fg uppercase tracking-wider">{label} Ratio</h3>
            <p className="text-[10px] text-fg-subtle mt-0.5">Target Range: 28% - 35%</p>
          </div>
          <span className={cn("text-xl font-bold num", color)}>{valuePct}%</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2 relative">
          <div
            className={cn(
              "h-full absolute left-0 top-0",
              isGood ? "bg-success" : isHigh ? "bg-danger" : "bg-warning"
            )}
            style={{ width: `${Math.min(100, valuePct)}%` }}
          />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-fg-muted font-bold mt-2">
          {isGood ? "● Ratio on target" : isHigh ? "▲ Alert: Over Budget boundary" : "▼ Under Budget threshold"}
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1.5 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs mb-1 font-semibold">Financial Control</div>
          <h2 className="text-xl font-bold tracking-tight text-fg">Finance Overview</h2>
          <p className="text-[12px] text-fg-subtle mt-0.5 font-normal">
            Real transactional revenue, cost ratios, margin audits, and operational diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["30d", "90d", "180d"].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r as QuickRange)}
              className={cn(
                "h-8 px-4 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors border cursor-pointer",
                activeRange === r
                  ? "bg-white/10 text-fg border-white/20"
                  : "bg-transparent text-fg-muted border-white/5 hover:text-fg hover:border-white/10"
              )}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error UI Banner */}
      {summary.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center justify-between gap-3 text-danger">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold">Failed to load financial metrics</p>
              <p className="text-[11px] text-fg-subtle mt-0.5">Please check backend connectivity or try refreshing.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-danger/30 hover:bg-danger/10 text-danger gap-1.5 cursor-pointer"
            onClick={() => summary.refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="summary" onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-white/5 p-1 rounded-xl mb-5 border border-white/5">
          {[
            { value: "summary", label: "Financial Summary" },
            { value: "trends", label: "Revenue Trends" },
            { value: "insights", label: "Payment Insights" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[12px] font-medium data-[state=active]:bg-white/10 data-[state=active]:text-fg rounded-lg px-4 py-1.5 transition-colors shadow-none data-[state=active]:shadow-none cursor-pointer"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Financial Summary */}
        <TabsContent value="summary" className="space-y-5">
          {summary.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-2xl" />
              ))}
            </div>
          ) : !data || data.totalOrders === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
              <ShieldAlert className="w-10 h-10 text-fg-subtle opacity-50 mb-1" />
              <p className="text-[13px] font-semibold text-fg">No financial transaction history recorded yet.</p>
              <p className="text-[11px] text-fg-subtle">Financial summaries will appear automatically as customer orders are processed.</p>
            </div>
          ) : (
            <>
              {/* Executive Finance Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Today's Revenue</span>
                  <span className="text-xl font-black text-success num mt-1">{formatCurrency(todayRev, "INR")}</span>
                </div>
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Today's Orders</span>
                  <span className="text-xl font-black text-fg num mt-1">{todayOrders}</span>
                </div>
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Avg. Order Value</span>
                  <span className="text-xl font-black text-fg num mt-1">{formatCurrency(avgOrderVal, "INR")}</span>
                </div>
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Refunds Issued</span>
                  <span className="text-xl font-black text-danger num mt-1">{formatCurrency(totalRefunds, "INR")}</span>
                </div>
                <div className={cn("col-span-2 lg:col-span-1 flex flex-col p-4 rounded-2xl border justify-center", businessHealth === "Healthy" ? "border-success/20 bg-success/5 text-success" : businessHealth === "Stable" ? "border-primary/20 bg-primary/5 text-primary" : "border-danger/20 bg-danger/5 text-danger")}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 select-none">Business Health</span>
                    {businessHealth === "Healthy" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[15.5px] font-black tracking-tight mt-1">{businessHealth.toUpperCase()}</span>
                  <span className="text-[10px] opacity-75 mt-0.5 font-normal truncate">{healthReason}</span>
                </div>
              </div>

              {/* Finance Insights briefing card */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex gap-3 items-start">
                <Lightbulb className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                <div className="text-[12px] leading-relaxed text-fg-muted">
                  <p className="font-bold text-fg">Executive Financial Observations</p>
                  <p className="mt-1 font-normal">
                    💡 Performance audit calculated strictly from {totalOrders} completed transactions. 
                    {data.cancelledOrders > 0 ? ` ${data.cancelledOrders} order cancellation(s) recorded in this period.` : " Zero order cancellations recorded."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                  <span className="text-[10px] font-bold text-success uppercase tracking-wider block border-b border-white/5 pb-1">
                    Revenue Summary
                  </span>
                  <div className="flex justify-between items-center">
                    <span>Gross Sales</span>
                    <span className="font-bold text-fg num">{formatCurrency(grossSales, "INR")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Net Sales</span>
                    <span className="font-bold text-fg num">{formatCurrency(netSales, "INR")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outstanding Receivables</span>
                    <span className="font-bold text-fg num">{formatCurrency(outstandingRec, "INR")}</span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider block border-b border-white/5 pb-1">
                    Order Performance
                  </span>
                  <div className="flex justify-between items-center">
                    <span>Total Orders (Period)</span>
                    <span className="font-bold text-fg num">{totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Voided / Cancelled Orders</span>
                    <span className="font-bold text-danger num">{cancelledOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Items Per Ticket</span>
                    <span className="font-bold text-fg num">{avgItemsPerTicket}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Revenue Trends */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <KpiCard
              title="Total Revenue"
              value={formatCurrency(totalRev, "INR")}
              icon={DollarSign}
              loading={summary.isLoading}
              accent="success"
            />
            <KpiCard
              title="Operational Contribution"
              value={data?.operationalContribution !== null && data?.operationalContribution !== undefined ? formatCurrency(data.operationalContribution, "INR") : "Not Available"}
              icon={TrendingUp}
              loading={summary.isLoading}
              accent="info"
              description={data?.operationalContribution !== null ? "Revenue minus Direct Costs (COGS)" : "Cost data awaiting entry"}
            />
            <KpiCard
              title="Revenue Growth"
              value={data?.revenueGrowth !== undefined ? `${data.revenueGrowth}%` : "0%"}
              icon={(data?.revenueGrowth ?? 0) >= 0 ? TrendingUp : TrendingDown}
              loading={summary.isLoading}
              accent={(data?.revenueGrowth ?? 0) >= 0 ? "success" : "danger"}
              description="vs Previous Period"
            />
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 sm:p-5">
            <h3 className="text-[13px] font-bold text-fg mb-4">P&L Trend (Revenue vs Food Cost)</h3>
            {trend.isLoading ? (
              <Skeleton className="h-[280px] w-full bg-white/5 rounded-xl" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend.data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString()}
                      stroke="rgba(255,255,255,0.2)"
                      fontSize={10}
                    />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      itemStyle={{ fontSize: "11px" }}
                      labelStyle={{ fontSize: "11px", color: "#888" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#22C55E"
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                    <Area
                      type="monotone"
                      dataKey="foodCost"
                      name="Food Cost"
                      stroke="#EF4444"
                      fillOpacity={1}
                      fill="url(#colorCost)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Payment Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            
            {/* Cost Ratios */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider">Cost Ratios</h3>
                <p className="text-[11.5px] text-fg-subtle font-normal">Department expenditure breakdown against revenue.</p>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {renderGauge("Food Cost", foodCostPct)}
                {renderGauge("Labor Cost", laborCostPct, data?.laborCostMessage)}
              </div>
            </div>

            {/* Profitability margins */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider">Profitability Breakdown</h3>
                <p className="text-[11.5px] text-fg-subtle font-normal">Item margin leaders vs low-return ingredients.</p>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                  <span className="text-[10px] font-bold text-success uppercase tracking-wider block border-b border-white/5 pb-1">
                    Highest Margins
                  </span>
                  {data?.topMarginItems && data.topMarginItems.length > 0 ? (
                    data.topMarginItems.map((item: any) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="truncate max-w-[120px]">{item.name}</span>
                        <span className="font-bold text-success num">{item.marginPct}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-fg-subtle italic py-2">Cost data awaiting ingredient pricing.</p>
                  )}
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                  <span className="text-[10px] font-bold text-danger uppercase tracking-wider block border-b border-white/5 pb-1">
                    Lowest Margins
                  </span>
                  {data?.lowestMarginItems && data.lowestMarginItems.length > 0 ? (
                    data.lowestMarginItems.map((item: any) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="truncate max-w-[120px]">{item.name}</span>
                        <span className="font-bold text-danger num">{item.marginPct}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-fg-subtle italic py-2">Cost data awaiting ingredient pricing.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 pt-4 border-t border-white/5">
            {/* Channel Splits */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider">Revenue Splits by Channel</h3>
                <p className="text-[11.5px] text-fg-subtle font-normal">Sales generation divided by order intake channels.</p>
              </div>
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                {data?.channelSplits && data.channelSplits.length > 0 ? (
                  data.channelSplits.map((ch: any) => (
                    <div key={ch.channel} className="space-y-1">
                      <div className="flex justify-between text-[11.5px]">
                        <span>{ch.channel}</span>
                        <span className="font-bold text-fg num">
                          {ch.percent}% ({formatCurrency(ch.val, "INR")})
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden relative">
                        <div className="bg-accent h-full absolute left-0 top-0" style={{ width: `${Math.min(100, ch.percent)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-fg-subtle italic py-2">No channel order history available.</p>
                )}
              </div>
            </div>

            {/* Expenses breakdown */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider">Expense Breakdown</h3>
                <p className="text-[11.5px] text-fg-subtle font-normal">Food, waste, and refund expenditures.</p>
              </div>
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-fg-muted">Food Cost (COGS)</span>
                  <span className="font-bold text-fg num">
                    {data?.foodCost !== null && data?.foodCost !== undefined
                      ? `${data.foodCostPct}% (${formatCurrency(data.foodCost, "INR")})`
                      : "Not Available"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-fg-muted">Staff Labor Cost</span>
                  <span className="font-bold text-fg num">
                    {data?.laborCost !== null && data?.laborCost !== undefined
                      ? `${data.laborCostPct}% (${formatCurrency(data.laborCost, "INR")})`
                      : "Not Available"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-fg-muted">Issued Refunds & Cancelled</span>
                  <span className="font-bold text-fg num">
                    {formatCurrency(totalRefunds, "INR")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-fg-muted">Logged Waste & Spoilage</span>
                  <span className="font-bold text-fg num">
                    {formatCurrency(data?.wasteCost ?? 0, "INR")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
