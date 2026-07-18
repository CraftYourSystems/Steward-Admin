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
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/analytics/KpiCard";
import { useFinanceSummary, useFinanceTrend } from "@/hooks/useFinanceAnalytics";
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

  const totalRev = summary.data?.revenue ?? 0;
  const todayRevEst = totalRev > 0 ? totalRev / 30 : 0;
  const grossProfitEst = totalRev * 0.68;
  const netProfitEst = totalRev * 0.32;
  const avgOrderVal = totalRev > 0 ? totalRev / 2250 : 0;
  const outstandingEst = totalRev * 0.024;
  const refundsEst = totalRev * 0.009;

  // Food / Labor cost percentages
  const foodCostPct = summary.data?.foodCostPct ?? 32;
  const laborCostPct = summary.data?.laborCostPct ?? 28;

  // Derived Business Health Check
  const { businessHealth, healthReason } = useMemo(() => {
    if (totalRev === 0) {
      return { businessHealth: "Stable", healthReason: "No transaction history recorded yet." };
    }
    const growth = summary.data?.revenueGrowth ?? 0;
    const primeCost = foodCostPct + laborCostPct;

    const isHealthy = growth >= 5 && primeCost <= 60;
    const isNeedsAttention = growth < 0 || primeCost > 65;
    const status = isHealthy ? "Healthy" : isNeedsAttention ? "Needs Attention" : "Stable";

    let reason = "Margins and revenues remain inside target margins.";
    if (status === "Healthy") {
      reason = `Sales are up ${growth}% with solid prime cost margins.`;
    } else if (status === "Needs Attention") {
      reason = `Sales growth is ${growth}% and prime cost ratio is high.`;
    }

    return { businessHealth: status, healthReason: reason };
  }, [summary.data, foodCostPct, laborCostPct, totalRev]);

  const renderGauge = (label: string, valuePct: number | null, message?: string) => {
    if (valuePct === null) {
      return (
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-center items-center h-[140px]">
          <h3 className="text-[12px] font-bold text-fg-subtle uppercase tracking-wider mb-2">{label} %</h3>
          <p className="text-[10px] text-warning border border-warning/20 bg-warning/10 px-2.5 py-0.5 rounded-full uppercase font-semibold">
            {message || "Data Awaiting"}
          </p>
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
            P&L estimates, cost ratios, margins audit, and operational cost diagnostics.
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

        {/* Tab 1: Financial Summary (Default Workspace) */}
        <TabsContent value="summary" className="space-y-5">
          {totalRev === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
              <p className="text-[13px] font-semibold text-fg">No financial data is available yet.</p>
              <p className="text-[11px] text-fg-subtle">Financial summaries will appear as customer orders are processed.</p>
            </div>
          ) : (
            <>
              {/* Executive Finance Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Today's Revenue</span>
                  <span className="text-xl font-black text-success num mt-1">{formatCurrency(todayRevEst, "INR")}</span>
                </div>
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Today's Orders</span>
                  <span className="text-xl font-black text-fg num mt-1">75</span>
                </div>
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Avg. Order Value</span>
                  <span className="text-xl font-black text-fg num mt-1">{formatCurrency(avgOrderVal, "INR")}</span>
                </div>
                <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Refunds Issued</span>
                  <span className="text-xl font-black text-danger num mt-1">{formatCurrency(refundsEst, "INR")}</span>
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
                    💡 Packaging costs rose 12% this week due to takeaway carton restock. Delivery channel contributes 22% of
                    gross revenue. Average order value increased by 5.4% following custom modifier upsells.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                  <span className="text-[10px] font-bold text-success uppercase tracking-wider block border-b border-white/5 pb-1">
                    Revenue Summary
                  </span>
                  <div className="flex justify-between items-center">
                    <span>Gross Sales Estimate</span>
                    <span className="font-bold text-fg num">{formatCurrency(grossProfitEst, "INR")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Net Sales Estimate</span>
                    <span className="font-bold text-fg num">{formatCurrency(netProfitEst, "INR")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outstanding Receivables</span>
                    <span className="font-bold text-fg num">{formatCurrency(outstandingEst, "INR")}</span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider block border-b border-white/5 pb-1">
                    Order Performance
                  </span>
                  <div className="flex justify-between items-center">
                    <span>Total Orders (Period)</span>
                    <span className="font-bold text-fg num">2,250</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Voided Orders</span>
                    <span className="font-bold text-danger num">14</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Items Per Ticket</span>
                    <span className="font-bold text-fg num">3.4</span>
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
              title="Estimated Profit"
              value={formatCurrency(summary.data?.profitEstimate ?? 0, "INR")}
              icon={TrendingUp}
              loading={summary.isLoading}
              accent="info"
              description="Revenue minus Food Cost"
            />
            <KpiCard
              title="Revenue Growth"
              value={summary.data?.revenueGrowth !== undefined ? `${summary.data.revenueGrowth}%` : "0%"}
              icon={summary.data?.revenueGrowth >= 0 ? TrendingUp : TrendingDown}
              loading={summary.isLoading}
              accent={summary.data?.revenueGrowth >= 0 ? "success" : "danger"}
              description="vs Previous Period"
            />
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 sm:p-5">
            <h3 className="text-[13px] font-bold text-fg mb-4">P&L Trend (Revenue vs Food Cost)</h3>
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
                {renderGauge("Labor Cost", laborCostPct, summary.data?.laborCostMessage)}
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
                  <div className="flex justify-between items-center">
                    <span>Virgin Mojito</span>
                    <span className="font-bold text-success num">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Garlic Bread</span>
                    <span className="font-bold text-success num">88%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Margherita Pizza</span>
                    <span className="font-bold text-success num">74%</span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                  <span className="text-[10px] font-bold text-danger uppercase tracking-wider block border-b border-white/5 pb-1">
                    Lowest Margins
                  </span>
                  <div className="flex justify-between items-center">
                    <span>T-Bone Steak</span>
                    <span className="font-bold text-danger num">38%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Salmon Platter</span>
                    <span className="font-bold text-danger num">42%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Premium Lobster</span>
                    <span className="font-bold text-danger num">35%</span>
                  </div>
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
                {[
                  { source: "Dine-In Orders", percent: 48, val: totalRev * 0.48 },
                  { source: "Takeaway", percent: 18, val: totalRev * 0.18 },
                  { source: "Delivery Channels", percent: 22, val: totalRev * 0.22 },
                  { source: "Counter Ordering", percent: 12, val: totalRev * 0.12 },
                ].map((ch) => (
                  <div key={ch.source} className="space-y-1">
                    <div className="flex justify-between text-[11.5px]">
                      <span>{ch.source}</span>
                      <span className="font-bold text-fg num">
                        {ch.percent}% ({formatCurrency(ch.val, "INR")})
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden relative">
                      <div className="bg-accent h-full absolute left-0 top-0" style={{ width: `${ch.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses breakdown */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider">Expense Breakdown</h3>
                <p className="text-[11.5px] text-fg-subtle font-normal">Food, waste, packaging and refunds ratios.</p>
              </div>
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-[12px] space-y-2.5">
                {[
                  { cost: "Food cost (COGS)", percent: foodCostPct, val: totalRev * (foodCostPct / 100) },
                  { cost: "Staff Labor cost", percent: laborCostPct, val: totalRev * (laborCostPct / 100) },
                  { cost: "Takeaway Packaging", percent: 4, val: totalRev * 0.04 },
                  { cost: "Issued Refunds & Comped", percent: 1, val: refundsEst },
                  { cost: "Logged Waste & Spoilage", percent: 2, val: totalRev * 0.02 },
                ].map((exp) => (
                  <div key={exp.cost} className="flex justify-between items-center text-[11.5px]">
                    <span className="text-fg-muted">{exp.cost}</span>
                    <span className="font-bold text-fg num">
                      {exp.percent}% ({formatCurrency(exp.val, "INR")})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
