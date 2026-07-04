"use client";

import { memo } from "react";
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemPerformanceData, ItemPerformanceItem } from "@/types";

interface Props {
  data?: ItemPerformanceData;
  loading?: boolean;
}

const MEDAL_COLORS = ["text-yellow-400", "text-zinc-400", "text-amber-700"];
const MEDAL_EMOJI  = ["🥇", "🥈", "🥉"];

function ItemRow({ item, index, type }: { item: ItemPerformanceItem; index: number; type: "best" | "worst" }) {
  const isBest = type === "best";
  return (
    <div className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
      <span className="text-sm shrink-0 w-5 text-center" aria-label={`Rank ${index + 1}`}>
        {isBest ? MEDAL_EMOJI[index] ?? (index + 1) : index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-fg truncate">{item.name}</p>
        <p className="text-[11px] text-fg-subtle num">
          {formatCurrency(item.totalRevenue)} · {item.percentage}% of sales
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[15px] font-semibold text-fg num">{item.totalQuantity}</span>
        <span className="text-[10px] text-fg-subtle ml-0.5">sold</span>
      </div>
    </div>
  );
}

export const BestWorstSellers = memo(function BestWorstSellers({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <Skeleton className="h-4 w-24 mb-4 bg-white/5" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full mb-2 bg-white/5 rounded" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const sections: { title: string; icon: typeof TrendingUp; items: ItemPerformanceItem[]; type: "best" | "worst"; accentClass: string }[] = [
    {
      title: "Best Sellers",
      icon: Trophy,
      items: data.bestSellers,
      type: "best",
      accentClass: "text-success bg-success/10 border-success/20",
    },
    {
      title: "Worst Sellers",
      icon: AlertTriangle,
      items: data.worstSellers,
      type: "worst",
      accentClass: "text-warning bg-warning/10 border-warning/20",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sections.map((sec) => (
        <div
          key={sec.title}
          className="rounded-[20px] border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                "grid place-items-center h-6 w-6 rounded-md border",
                sec.accentClass
              )}
            >
              <sec.icon className="h-3 w-3" />
            </div>
            <span className="text-[13px] font-semibold text-fg">{sec.title}</span>
          </div>

          {sec.items.length === 0 ? (
            <p className="text-[12px] text-fg-subtle py-4 text-center">
              No data in this period
            </p>
          ) : (
            <div className="divide-y divide-border">
              {sec.items.map((item, i) => (
                <ItemRow key={item.menuItemId} item={item} index={i} type={sec.type} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
