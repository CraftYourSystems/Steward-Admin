import React from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, AlertCircle } from "lucide-react";
import { HourlyThroughputData, useKitchenSummary } from "@/hooks/useKitchenIntelligence";

interface KitchenThroughputProps {
  avgPrepTimeMins?: number | null;
  throughputData?: HourlyThroughputData[];
  loading?: boolean;
}

export function KitchenThroughput({ avgPrepTimeMins: propAvg, throughputData: propData, loading: propLoading }: KitchenThroughputProps) {
  const { data: summary, isLoading: summaryLoading } = useKitchenSummary(!propData);

  const loading = propLoading !== undefined ? propLoading : summaryLoading;
  const avgPrepMins = propAvg !== undefined ? propAvg : summary?.prepTime?.avgPrepTimeMins ?? null;
  const chartData = propData || summary?.prepTime?.hourlyThroughput || [];

  if (loading) {
    return (
      <div className="card-premium p-5 sm:p-6 flex flex-col justify-between animate-shimmer min-h-[220px]">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-md bg-white/5" />
          <div className="h-8 w-36 rounded-md bg-white/5" />
        </div>
        <div className="h-16 w-full rounded-md bg-white/5 mt-auto" />
      </div>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="card-premium p-5 sm:p-6 flex flex-col justify-between h-full relative group min-h-[220px]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3 className="label-xs text-fg-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Kitchen Throughput
          </h3>
          <div className="text-3xl font-bold tracking-tighter text-fg flex items-baseline gap-1">
            {avgPrepMins !== null ? (
              <>
                {avgPrepMins.toFixed(0)}
                <span className="text-sm font-medium text-fg-subtle tracking-normal">
                  avg mins
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-fg-subtle italic">Not Available</span>
            )}
          </div>
        </div>
        <div className="text-[11px] font-medium text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20">
          Target: 15m
        </div>
      </div>

      {!hasData ? (
        <div className="h-[90px] w-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.01] mt-auto">
          <AlertCircle className="h-4 w-4 text-fg-subtle mb-1" />
          <span className="text-[11px] font-medium text-fg-subtle">No operational data yet</span>
          <span className="text-[9px] text-fg-subtle/70">Awaiting historical kitchen activity</span>
        </div>
      ) : (
        <div className="h-[80px] w-full -mx-2 mt-auto pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="prepGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as HourlyThroughputData;
                    return (
                      <div className="bg-black/90 border border-white/10 shadow-elevated rounded-lg px-3 py-2 text-[12px] text-fg">
                        <div className="text-fg-subtle font-mono text-[10px] mb-0.5">{item.hour}</div>
                        <div>Completed: <strong className="text-fg">{item.completedOrdersCount} orders</strong></div>
                        <div>Avg Prep: <strong className="text-accent">{item.avgPrepMins} mins</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: 'hsl(var(--border-strong))', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="avgPrepMins"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#prepGradient)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
