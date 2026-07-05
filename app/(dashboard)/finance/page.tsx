"use client";

import { useState, useMemo } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/analytics/KpiCard";
import { useFinanceSummary, useFinanceTrend } from "@/hooks/useFinanceAnalytics";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";

type QuickRange = "30d" | "90d" | "180d";
const ISO = (d: Date) => d.toISOString();

function getRange(range: QuickRange) {
  const now = new Date();
  switch (range) {
    case "30d": return { from: ISO(startOfDay(subDays(now, 29))), to: ISO(endOfDay(now)) };
    case "90d": return { from: ISO(startOfDay(subDays(now, 89))), to: ISO(endOfDay(now)) };
    case "180d": default: return { from: ISO(startOfDay(subDays(now, 179))), to: ISO(endOfDay(now)) };
  }
}

export default function FinancePage() {
  const [activeRange, setActiveRange] = useState<QuickRange>("30d");
  const params = useMemo(() => getRange(activeRange), [activeRange]);
  
  const summary = useFinanceSummary(params);
  const trend = useFinanceTrend({ ...params, interval: "daily" });

  const isFetching = summary.isFetching || trend.isFetching;

  // Gauges
  const renderGauge = (label: string, valuePct: number | null, message?: string) => {
    if (valuePct === null) {
      return (
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-5 flex flex-col justify-center items-center h-[180px]">
          <h3 className="text-sm font-semibold text-fg mb-2">{label} %</h3>
          <p className="text-xs text-warning border border-warning/20 bg-warning/10 px-3 py-1 rounded-full">
            {message || "Data Unavailable"}
          </p>
        </div>
      );
    }
    
    // Benchmark 28-35%
    const isGood = valuePct >= 28 && valuePct <= 35;
    const isHigh = valuePct > 35;
    const color = isGood ? "text-success" : (isHigh ? "text-danger" : "text-warning");

    return (
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-5 flex flex-col h-[180px]">
        <h3 className="text-sm font-semibold text-fg">{label} %</h3>
        <p className="text-xs text-fg-subtle mb-4">Target Band: 28% - 35%</p>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className={cn("text-4xl font-bold tracking-tight", color)}>{valuePct}%</span>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-fg-subtle font-semibold">
              {isGood ? "On Target" : (isHigh ? "Over Budget" : "Under Budget")}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Finance</h2>
          <p className="text-[12px] text-fg-subtle mt-1">P&L estimates and cost analysis.</p>
        </div>
        <div className="flex gap-2">
          {["30d", "90d", "180d"].map(r => (
            <button
              key={r}
              onClick={() => setActiveRange(r as QuickRange)}
              className={cn(
                "h-7 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors border",
                activeRange === r ? "bg-white/10 text-fg border-white/20" : "bg-transparent text-fg-muted border-white/5"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(summary.data?.revenue ?? 0, "INR")}
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

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        {renderGauge("Food Cost", summary.data?.foodCostPct)}
        {renderGauge("Labor Cost", summary.data?.laborCostPct, summary.data?.laborCostMessage)}
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-fg mb-4">P&L Trend (Revenue vs Food Cost)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--danger))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--danger))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString()} stroke="rgba(255,255,255,0.2)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ fontSize: "12px" }}
                labelStyle={{ fontSize: "12px", color: "#888" }}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="foodCost" name="Food Cost" stroke="hsl(var(--danger))" fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}