import React from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock } from "lucide-react";

interface KitchenThroughputProps {
  avgPrepTimeMins: number;
  loading: boolean;
}

// Dummy data for visual effect since backend doesn't provide hourly timeline yet
const data = [
  { time: '10am', prep: 12 },
  { time: '11am', prep: 14 },
  { time: '12pm', prep: 18 },
  { time: '1pm', prep: 22 },
  { time: '2pm', prep: 16 },
  { time: '3pm', prep: 11 },
];

export function KitchenThroughput({ avgPrepTimeMins, loading }: KitchenThroughputProps) {
  if (loading) {
    return (
      <div className="card-premium p-6 flex flex-col justify-between animate-shimmer min-h-[160px]">
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="card-premium p-6 flex flex-col justify-between h-full relative group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className="label-xs text-fg-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Kitchen Throughput
          </h3>
          <div className="text-3xl font-bold tracking-tighter text-fg flex items-baseline gap-1">
            {avgPrepTimeMins.toFixed(0)}
            <span className="text-sm font-medium text-fg-subtle tracking-normal">
              avg mins
            </span>
          </div>
        </div>
        <div className="text-[11px] font-medium text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20">
          Target: 15m
        </div>
      </div>

      <div className="h-[80px] w-full -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="prepGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface border border-border shadow-elevated rounded-lg px-3 py-2 text-[12px]">
                      <span className="text-fg-subtle">{payload[0].payload.time}: </span>
                      <span className="text-fg font-bold">{payload[0].value} mins</span>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: 'hsl(var(--border-strong))', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="prep"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fill="url(#prepGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
