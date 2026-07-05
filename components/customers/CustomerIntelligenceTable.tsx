"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  data?: {
    segments: any;
    customers: any[];
  };
  loading?: boolean;
}

export function CustomerIntelligenceTable({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-[400px] w-full rounded-[20px] bg-white/5" />;

  const customers = data?.customers;
  if (!customers || customers.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center rounded-[20px] border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-fg-muted">No customer data available.</p>
      </div>
    );
  }

  const segmentColor = (seg: string) => {
    switch (seg) {
      case "Champions": return "text-success bg-success/10 border border-success/20";
      case "New": return "text-primary bg-primary/10 border border-primary/20";
      case "At-Risk": return "text-warning bg-warning/10 border border-warning/20";
      default: return "text-danger bg-danger/10 border border-danger/20";
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 overflow-hidden flex flex-col max-h-[500px]">
      <div className="p-4 sm:p-5 border-b border-white/10 bg-surface-1">
        <h3 className="text-sm font-semibold text-fg">Customer Intelligence</h3>
        <p className="text-xs text-fg-subtle">Loyalty scores and favorites per customer</p>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3">Loyalty Score</th>
              <th className="px-4 py-3">Avg Days/Visit</th>
              <th className="px-4 py-3">Favorite Item</th>
              <th className="px-4 py-3">Favorite Cat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-fg">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", segmentColor(c.segment))}>
                    {c.segment}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold", scoreColor(c.loyaltyScore))}>{c.loyaltyScore}</span>
                    <span className="text-[10px] text-fg-muted">/ 100</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-fg-subtle">
                  {c.totalOrders > 1 ? `${c.timeBetweenVisits} days` : "N/A"}
                </td>
                <td className="px-4 py-3 text-fg-subtle">{c.favoriteItem || "-"}</td>
                <td className="px-4 py-3 text-fg-subtle">{c.favoriteCategory || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}