"use client";

import React from "react";
import { useWastePercentage, useStockoutIncidents, useCostTrends } from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen, AlertTriangle, TrendingUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function InventoryPage() {
  const waste = useWastePercentage();
  const stockouts = useStockoutIncidents();
  const costs = useCostTrends();

  const isLoading = waste.isLoading || stockouts.isLoading || costs.isLoading;

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <div className="label-xs mb-1">Administration</div>
        <h2 className="text-xl font-semibold tracking-tight text-fg">Inventory Health</h2>
        <p className="text-[12px] text-fg-subtle mt-1">Waste tracking, Stockouts & Cost Alerts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Waste Percentage */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <Trash2 className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Waste & Spoilage</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="space-y-3">
              {waste.data?.map((item: any) => (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-fg">{item.name}</span>
                    <span className={cn("text-[13px] font-bold num", item.wastePercent > 10 ? "text-danger" : "text-fg")}>
                      {item.wastePercent}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-fg-subtle">
                    <span>Usage: {item.theoreticalUsage} {item.unit}</span>
                    <span>Wasted: {item.wastedQuantity} {item.unit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden mt-1 relative">
                    <div className={cn("h-full absolute left-0 top-0", item.wastePercent > 10 ? "bg-danger" : "bg-warning")} style={{ width: `${Math.min(100, item.wastePercent)}%` }} />
                  </div>
                </div>
              ))}
              {waste.data?.length === 0 && <p className="text-sm text-fg-muted italic">No waste data.</p>}
            </div>
          )}
        </div>

        {/* Cost Volatility */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <TrendingUp className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Price Volatility</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="space-y-3">
              {costs.data?.map((item: any) => (
                <div key={item.ingredientId} className={cn("flex flex-col gap-2 rounded-lg border p-3", item.isVolatile ? "border-danger/30 bg-danger/5" : "border-border bg-surface-2")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.isVolatile && <AlertTriangle className="h-3 w-3 text-danger" />}
                      <span className="text-[13px] font-medium text-fg">{item.name}</span>
                    </div>
                    <Badge variant={item.isVolatile ? "danger" : "neutral"} className="text-[10px]">
                      {item.maxSpikePercent > 0 ? "+" : ""}{item.maxSpikePercent}% spike
                    </Badge>
                  </div>
                  {item.changes.length > 0 && (
                    <div className="text-[11px] text-fg-subtle flex justify-between">
                      <span>Latest:</span>
                      <span className="num">
                        ${item.changes[item.changes.length-1].oldCost} → ${item.changes[item.changes.length-1].newCost}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {costs.data?.length === 0 && <p className="text-sm text-fg-muted italic">No cost changes tracked.</p>}
            </div>
          )}
        </div>

        {/* Stockouts */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <PackageOpen className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Stockout Incidents</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="space-y-3">
              {stockouts.data?.map((incident: any) => (
                <div key={incident.id} className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-fg">{incident.name}</span>
                    <span className="text-[10px] text-fg-subtle num">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-fg-subtle mt-1">
                    {incident.resolvedAt ? (
                      <span className="text-success">Resolved in {incident.durationMins}m</span>
                    ) : (
                      <span className="text-danger flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Currently Stocked Out</span>
                    )}
                  </div>
                </div>
              ))}
              {stockouts.data?.length === 0 && <p className="text-sm text-fg-muted italic">No recent stockouts.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}