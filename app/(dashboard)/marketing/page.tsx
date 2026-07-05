"use client";

import { useState, useMemo } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { Megaphone, Ticket, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/analytics/KpiCard";
import { useMarketingSummary } from "@/hooks/useMarketingAnalytics";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
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

const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--danger))"];

export default function MarketingPage() {
  const [activeRange, setActiveRange] = useState<QuickRange>("30d");
  const params = useMemo(() => getRange(activeRange), [activeRange]);
  
  const summary = useMarketingSummary(params);
  
  const mix = summary.data?.acquisitionMix || [];

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Marketing</h2>
          <p className="text-[12px] text-fg-subtle mt-1">Acquisition sources and campaign performance.</p>
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

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/5 p-5 opacity-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <Ticket className="w-4 h-4 text-warning" />
              Promo / Voucher Redemption
            </h3>
          </div>
          <p className="text-3xl font-bold text-fg my-2">-- %</p>
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-xs font-semibold px-3 py-1 bg-surface-2 rounded-full border border-white/10">
              No campaign system yet (Requires V3)
            </span>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/5 p-5 opacity-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              Campaign ROI
            </h3>
          </div>
          <p className="text-3xl font-bold text-fg my-2">-- x</p>
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-xs font-semibold px-3 py-1 bg-surface-2 rounded-full border border-white/10">
              No campaign system yet (Requires V3)
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-fg mb-1 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-info" />
            Acquisition Source Mix
          </h3>
          <p className="text-xs text-fg-subtle mb-6">Volume of orders by acquisition channel</p>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mix}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="source"
                  stroke="none"
                >
                  {mix.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-1 bg-black/20 rounded-xl p-4 overflow-y-auto max-h-[300px] custom-scrollbar">
          <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-widest mb-3">Revenue by Source</h4>
          <div className="space-y-3">
            {mix.map((m: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div>
                    <div className="text-sm font-medium text-fg">{m.source}</div>
                    <div className="text-[10px] text-fg-subtle">{m.count} orders</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-success">
                  {formatCurrency(m.revenue, "INR")}
                </div>
              </div>
            ))}
            {mix.length === 0 && !summary.isLoading && (
              <div className="text-sm text-fg-muted text-center py-4">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}