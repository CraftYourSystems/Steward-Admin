"use client";

import React from "react";
import { useDropOffFunnel, useSearchAnalytics, useCartMetrics, useScanToFirstAdd, useScrollDepth } from "@/hooks/useBehaviorAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Timer, ArrowDownRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BehaviorAnalyticsPage() {
  const funnel = useDropOffFunnel();
  const search = useSearchAnalytics();
  const cart = useCartMetrics();
  const scanToAdd = useScanToFirstAdd();
  const scroll = useScrollDepth();

  const isLoading = funnel.isLoading || search.isLoading || cart.isLoading || scanToAdd.isLoading || scroll.isLoading;

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <div className="label-xs mb-1">Analytics</div>
        <h2 className="text-xl font-semibold tracking-tight text-fg">On-Site Behavior</h2>
        <p className="text-[12px] text-fg-subtle mt-1">Funnel, Search Intent, and Abandonment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Drop-off Funnel */}
        <div className="card-premium p-4 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-fg-subtle">
            <ArrowDownRight className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Conversion Funnel</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center gap-2 p-3 bg-surface-2 border border-border rounded-lg text-center">
                <span className="text-[11px] font-bold text-fg-subtle uppercase">Scan</span>
                <span className="text-2xl font-bold text-fg num">{funnel.data?.scan || 0}</span>
                <span className="text-[10px] text-fg-muted">100% (Entered)</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-surface-2 border border-border rounded-lg text-center relative">
                <span className="text-[11px] font-bold text-fg-subtle uppercase">Browse</span>
                <span className="text-2xl font-bold text-fg num">{funnel.data?.browse || 0}</span>
                <span className="text-[10px] text-danger font-medium">-{Math.round(funnel.data?.dropOffToBrowse || 0)}% drop</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-surface-2 border border-border rounded-lg text-center relative">
                <span className="text-[11px] font-bold text-fg-subtle uppercase">Cart</span>
                <span className="text-2xl font-bold text-fg num">{funnel.data?.cart || 0}</span>
                <span className="text-[10px] text-danger font-medium">-{Math.round(funnel.data?.dropOffToCart || 0)}% drop</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-surface-2 border border-border rounded-lg text-center relative">
                <span className="text-[11px] font-bold text-success uppercase">Pay</span>
                <span className="text-2xl font-bold text-success num">{funnel.data?.pay || 0}</span>
                <span className="text-[10px] text-danger font-medium">-{Math.round(funnel.data?.dropOffToPay || 0)}% drop</span>
              </div>
            </div>
          )}
        </div>

        {/* Speed Metrics */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <Timer className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Speed & Decisions</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-surface-2 border border-border rounded-lg flex justify-between items-center">
                <span className="text-[12px] text-fg-subtle">Avg Decision Time</span>
                <span className="text-lg font-bold text-fg num">{cart.data?.avgDecisionTimeSec}s</span>
              </div>
              <div className="p-3 bg-surface-2 border border-border rounded-lg flex justify-between items-center">
                <span className="text-[12px] text-fg-subtle">Scan to 1st Add</span>
                <span className="text-lg font-bold text-fg num">{scanToAdd.data?.medianTimeSec}s <span className="text-[10px] text-fg-muted font-normal">(median)</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Search Analytics */}
        <div className="card-premium p-4 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-fg-subtle">
            <Search className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Search Intent</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {search.data?.map((s: any, i: number) => (
                <div key={i} className={cn("flex justify-between items-center p-2 rounded-md border", s.zeroMatch ? "border-warning/30 bg-warning/5" : "border-border bg-surface-2")}>
                  <div className="flex items-center gap-2">
                    {s.zeroMatch && <AlertTriangle className="h-3 w-3 text-warning" aria-label="Zero results match" />}
                    <span className="text-[13px] font-medium text-fg">"{s.query}"</span>
                  </div>
                  <span className="text-[12px] text-fg-subtle num">{s.count} searches</span>
                </div>
              ))}
              {search.data?.length === 0 && <p className="text-sm text-fg-muted italic">No search events tracked.</p>}
            </div>
          )}
        </div>

        {/* Abandonment */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <ShoppingCart className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Abandonment</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 bg-surface-2 border border-border rounded-lg h-full">
              <span className="text-4xl font-bold text-danger num mb-2">{cart.data?.abandonmentRate}%</span>
              <span className="text-[12px] text-fg-subtle">Cart Abandonment Rate</span>
              <span className="text-[11px] text-fg-muted mt-4">({cart.data?.abandonedCarts} abandoned sessions)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}