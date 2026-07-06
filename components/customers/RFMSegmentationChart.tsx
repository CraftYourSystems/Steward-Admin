"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  data?: {
    segments: { champions: number; atRisk: number; new: number; lost: number };
    customers: any[];
  };
  loading?: boolean;
}

export function RFMSegmentationChart({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-[300px] w-full rounded-[20px] bg-white/5" />;

  const segments = data?.segments;
  if (!segments) {
    return (
      <div className="h-[300px] flex items-center justify-center rounded-[20px] border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-fg-muted">No segment data available.</p>
      </div>
    );
  }

  const total = segments.champions + segments.atRisk + segments.new + segments.lost;

  const boxes = [
    { label: "Champions", desc: "Frequent, recent, high spend", count: segments.champions, color: "bg-success text-white", border: "border-success/20" },
    { label: "New", desc: "1 order, recent", count: segments.new, color: "bg-primary text-primary-foreground", border: "border-primary/20" },
    { label: "At-Risk", desc: "Multiple orders, >30d inactive", count: segments.atRisk, color: "bg-warning text-black", border: "border-warning/20" },
    { label: "Lost", desc: ">90d inactive", count: segments.lost, color: "bg-danger text-white", border: "border-danger/20" },
  ];

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">RFM Segmentation</h3>
        <p className="text-xs text-fg-subtle">Recency, Frequency, Monetary grouping</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 flex-1">
        {boxes.map(b => {
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          return (
            <div key={b.label} className={cn("p-4 rounded-xl flex flex-col justify-between border", b.border, "bg-white/5")}>
              <div>
                <div className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2", b.color)}>
                  {b.label}
                </div>
                <p className="text-[11px] text-fg-subtle leading-tight">{b.desc}</p>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-fg">{b.count}</span>
                <span className="text-[11px] text-fg-muted ml-2">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}