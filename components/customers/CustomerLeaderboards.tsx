"use client";

import React, { useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Trophy, Medal, Star, TrendingUp, IndianRupee, Repeat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Customer {
  id: string;
  name: string;
  totalOrders: number;
  totalSpend: number;
  recencyDays: number;
  timeBetweenVisits: number;
  segment: string;
  loyaltyScore: number;
}

interface Props {
  customers: Customer[];
  isLoading: boolean;
}

export function CustomerLeaderboards({ customers, isLoading }: Props) {
  const topSpenders = useMemo(() => {
    return [...customers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 10);
  }, [customers]);

  const mostFrequent = useMemo(() => {
    return [...customers].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 10);
  }, [customers]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
        <Skeleton className="h-[400px] w-full rounded-[20px] bg-white/5" />
        <Skeleton className="h-[400px] w-full rounded-[20px] bg-white/5" />
      </div>
    );
  }

  const renderRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />;
      default:
        return <div className="w-5 h-5 flex items-center justify-center font-bold text-fg-subtle text-xs">{index + 1}</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
      {/* Top Spenders Leaderboard */}
      <div className="rounded-[20px] border border-white/10 bg-white/5 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-accent" /> Top Spenders
            </h3>
            <p className="text-[12px] text-fg-subtle mt-0.5">Highest lifetime value customers</p>
          </div>
        </div>
        <div className="p-0 overflow-y-auto max-h-[500px]">
          {topSpenders.length === 0 ? (
            <div className="p-8 text-center text-fg-muted text-sm">No customers found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle sticky top-0 z-10">
                <tr>
                  <th className="p-3 pl-5 w-16 text-center">Rank</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Total Spend</th>
                  <th className="p-3 text-right pr-5">Avg Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topSpenders.map((c, i) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-3 pl-5 text-center flex justify-center">
                      {renderRankIcon(i)}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-[13px] text-fg group-hover:text-accent transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-fg-muted mt-0.5">{c.totalOrders} visits</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-[13px] font-bold text-fg num">
                        ₹{c.totalSpend.toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className="p-3 text-right pr-5">
                      <div className="text-[13px] text-fg-muted num">
                        ₹{c.totalOrders > 0 ? Math.round(c.totalSpend / c.totalOrders).toLocaleString("en-IN") : 0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Most Frequent Visitors Leaderboard */}
      <div className="rounded-[20px] border border-white/10 bg-white/5 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-400" /> Most Frequent
            </h3>
            <p className="text-[12px] text-fg-subtle mt-0.5">Most loyal repeat visitors</p>
          </div>
        </div>
        <div className="p-0 overflow-y-auto max-h-[500px]">
          {mostFrequent.length === 0 ? (
            <div className="p-8 text-center text-fg-muted text-sm">No customers found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle sticky top-0 z-10">
                <tr>
                  <th className="p-3 pl-5 w-16 text-center">Rank</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Visits</th>
                  <th className="p-3 text-right pr-5">Recency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mostFrequent.map((c, i) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-3 pl-5 text-center flex justify-center">
                      {renderRankIcon(i)}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-[13px] text-fg group-hover:text-emerald-400 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-fg-muted mt-0.5">{c.segment}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-[13px] font-bold text-fg num">
                        {c.totalOrders}
                      </div>
                    </td>
                    <td className="p-3 text-right pr-5">
                      <div className="text-[13px] text-fg-muted num">
                        {c.recencyDays}d ago
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
