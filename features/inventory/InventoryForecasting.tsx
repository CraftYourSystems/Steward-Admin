"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Brain, Calendar, PackageOpen, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface ForecastData {
  ingredientId: string;
  name: string;
  unit: string;
  currentStock: number;
  projectedNeed: number;
  reorderRecommendation: number;
}

export function InventoryForecasting() {
  // Default to tomorrow
  const [targetDate, setTargetDate] = useState<string>(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );

  const { data: forecast = [], isLoading, error } = useQuery({
    queryKey: ["inventory", "forecast", targetDate],
    queryFn: async () => {
      const res = await api.get(`/api/inventory-analytics/forecast?targetDate=${targetDate}`);
      return res.data as ForecastData[];
    },
  });

  const totalReorders = forecast.filter((f) => f.reorderRecommendation > 0).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl">
        <div className="space-y-1">
          <h3 className="text-[14px] font-bold flex items-center gap-2 text-fg">
            <Brain className="w-4 h-4 text-accent" /> AI Predictive Forecasting
          </h3>
          <p className="text-[12px] text-fg-subtle">
            Forecasts your required ingredient quantities based on historical averages for this day of the week over the last 28 days.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-fg-muted" />
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-9 w-full md:w-[160px] bg-[#1a1a1c] border border-white/10 text-fg focus:border-white/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full bg-white/5 rounded-lg" />
          <Skeleton className="h-10 w-full bg-white/5 rounded-lg" />
          <Skeleton className="h-10 w-full bg-white/5 rounded-lg" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-danger/10 text-danger border border-danger/20 text-sm">
          Failed to load forecast data. Ensure the backend is running.
        </div>
      ) : forecast.length === 0 ? (
        <div className="p-8 text-center border border-white/5 rounded-xl bg-white/[0.01]">
          <PackageOpen className="w-8 h-8 mx-auto text-fg-muted mb-2" />
          <p className="text-[13px] font-medium text-fg">No historical data found</p>
          <p className="text-[11px] text-fg-subtle mt-1">We couldn't generate a forecast because there are no completed orders for this day of the week in the past 28 days.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {totalReorders > 0 && (
            <div className="p-3.5 rounded-xl border border-warning/20 bg-warning/5 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-warning" />
              <p className="text-[12px] text-warning font-medium">
                You need to order <span className="font-bold">{totalReorders} items</span> to meet projected demand for this date.
              </p>
            </div>
          )}
          {totalReorders === 0 && (
            <div className="p-3.5 rounded-xl border border-success/20 bg-success/5 flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-success" />
              <p className="text-[12px] text-success font-medium">
                Your current stock levels are sufficient to meet projected demand for this date!
              </p>
            </div>
          )}

          <div className="rounded-xl border border-white/5 bg-[#131315] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-fg-subtle font-bold bg-white/[0.02]">
                    <th className="p-3 font-medium">Ingredient</th>
                    <th className="p-3 font-medium text-right">Projected Need</th>
                    <th className="p-3 font-medium text-right">Current Stock</th>
                    <th className="p-3 font-medium text-right">To Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {forecast.map((item) => (
                    <tr key={item.ingredientId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 text-[13px] font-medium text-fg">
                        {item.name}
                      </td>
                      <td className="p-3 text-[13px] text-right num">
                        {item.projectedNeed} <span className="text-fg-subtle text-[11px]">{item.unit}</span>
                      </td>
                      <td className="p-3 text-[13px] text-right num">
                        <span className={cn(item.currentStock < item.projectedNeed ? "text-warning" : "text-fg")}>
                          {item.currentStock}
                        </span>{" "}
                        <span className="text-fg-subtle text-[11px]">{item.unit}</span>
                      </td>
                      <td className="p-3 text-right">
                        {item.reorderRecommendation > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-warning/10 text-warning text-[11px] font-bold num border border-warning/20">
                            <TrendingUp className="w-3 h-3" />
                            +{item.reorderRecommendation} {item.unit}
                          </div>
                        ) : (
                          <span className="text-[11px] text-success font-medium flex items-center justify-end gap-1">
                            <CheckCircle className="w-3 h-3" /> Sufficient
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
