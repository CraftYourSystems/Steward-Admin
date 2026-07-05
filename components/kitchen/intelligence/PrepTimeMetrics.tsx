"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  prepData?: { station: string; avgPrepTimeMins: number }[];
  delayData?: { avgKitchenDelayMins: number; avgFohDelayMins: number; totalOrders: number };
  loading?: boolean;
}

export const PrepTimeMetrics = memo(function PrepTimeMetrics({ prepData, delayData, loading }: Props) {
  if (loading) return <Skeleton className="h-[90px] w-full bg-white/5 rounded-xl" />;
  
  const avgKitchen = delayData?.avgKitchenDelayMins || 0;
  const avgFOH = delayData?.avgFohDelayMins || 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between h-[90px]">
      <div className="flex items-center gap-1.5 text-fg-subtle mb-1">
        <Clock className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">Kitchen vs FOH Delay</span>
      </div>
      
      <div className="flex items-end justify-between mt-auto">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tracking-tight text-fg num">{avgKitchen}</span>
            <span className="text-[10px] text-fg-muted font-medium">min</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D9B872]">Kitchen</span>
        </div>

        <div className="text-fg-subtle/30 text-xl font-light">/</div>

        <div className="text-right">
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-xl font-semibold tracking-tight text-fg num">{avgFOH}</span>
            <span className="text-[10px] text-fg-muted font-medium">min</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-info">FOH</span>
        </div>
      </div>
    </div>
  );
});
