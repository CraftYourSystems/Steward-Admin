"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  data?: {
    stage: string;
    count: number;
    description: string;
  }[];
  loading?: boolean;
}

export function CustomerJourneyFunnel({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-[300px] w-full rounded-[20px] bg-white/5" />;

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center rounded-[20px] border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-fg-muted">No journey data available.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-fg">Customer Journey Drop-off</h3>
        <p className="text-xs text-fg-subtle">Funnel from acquisition to retention</p>
      </div>
      
      <div className="space-y-4 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        {data.map((stage, idx) => {
          const pct = Math.round((stage.count / maxCount) * 100);
          const isChurn = stage.stage.includes("Churned");
          return (
            <div key={idx} className="w-full">
              <div className="flex justify-between items-end mb-1">
                <div>
                  <div className={cn("text-[13px] font-semibold", isChurn ? "text-danger" : "text-fg")}>
                    {stage.stage}
                  </div>
                  <div className="text-[10px] text-fg-subtle">{stage.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-fg">{stage.count}</div>
                </div>
              </div>
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000", isChurn ? "bg-danger" : "bg-primary")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}