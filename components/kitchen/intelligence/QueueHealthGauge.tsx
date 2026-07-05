"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data?: { activeOrders: number; capacity: number; status: 'green' | 'amber' | 'red' };
  loading?: boolean;
}

export const QueueHealthGauge = memo(function QueueHealthGauge({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-[90px] w-full bg-white/5 rounded-xl" />;
  if (!data) return null;

  const { activeOrders, capacity, status } = data;
  const percentage = Math.min(100, (activeOrders / capacity) * 100);

  const colors = {
    green: { bg: "bg-success/20", border: "border-success/30", text: "text-success" },
    amber: { bg: "bg-warning/20", border: "border-warning/30", text: "text-warning" },
    red: { bg: "bg-danger/20", border: "border-danger/30", text: "text-danger" },
  };

  const theme = colors[status];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-center relative overflow-hidden h-[90px]">
      <div className="flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-1.5 text-fg-subtle">
          <Activity className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Queue Load</span>
        </div>
        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border", theme.bg, theme.border, theme.text)}>
          {status}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2 z-10">
        <span className="text-2xl font-semibold tracking-tight text-fg num leading-none">
          {activeOrders}
        </span>
        <span className="text-xs text-fg-muted font-medium">/ {capacity} capacity</span>
      </div>

      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <div 
          className={cn("h-full transition-all duration-500", theme.text.replace("text-", "bg-"))} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
