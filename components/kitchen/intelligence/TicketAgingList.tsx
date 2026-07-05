"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Timer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

interface Ticket {
  id: string;
  orderNumber: string;
  createdAt: string;
  estimatedMins: number;
  orderType: string;
  delayReason: string | null;
  elapsedMins: number;
  isDelayed: boolean;
}

interface Props {
  data?: Ticket[];
  loading?: boolean;
}

export const TicketAgingList = memo(function TicketAgingList({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-[90px] w-full bg-white/5 rounded-xl" />;
  
  // Show max 3 oldest tickets
  const tickets = data?.slice(0, 3) || [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col h-[90px] overflow-hidden">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-1.5 text-fg-subtle">
          <Timer className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Oldest Tickets</span>
        </div>
        <span className="text-[11px] font-medium text-fg-muted">
          {data?.length || 0} unstarted
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-hidden min-h-0">
        {tickets.length === 0 ? (
          <p className="text-[10px] text-fg-subtle italic flex items-center h-full">No unstarted tickets</p>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                {t.isDelayed && (
                  <AlertTriangle className="h-3 w-3 text-danger shrink-0 animate-pulse" />
                )}
                <span className={cn("font-semibold truncate", t.isDelayed ? "text-danger" : "text-fg-muted")}>
                  #{t.orderNumber}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-fg-subtle shrink-0">
                  {t.orderType.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold num",
                  t.isDelayed ? "bg-danger/20 text-danger border border-danger/30" : "text-fg"
                )}>
                  {t.elapsedMins}m
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
