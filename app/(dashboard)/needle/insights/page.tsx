"use client";

import React from "react";
import { useNeedleCostOptimization, useNeedleInsights, useNeedleForecasts } from "@/hooks/useNeedleAdvisor";
import { Loader2, TrendingUp, HelpCircle, DollarSign, Activity } from "lucide-react";

export default function NeedleInsightsPage() {
  const { data: cost, isLoading: isCostLoading } = useNeedleCostOptimization();
  const { data: insights, isLoading: isInsightsLoading } = useNeedleInsights();
  const { data: forecasts, isLoading: isForecastsLoading } = useNeedleForecasts();

  if (isCostLoading || isInsightsLoading || isForecastsLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>Loading operational intelligence and forecasts...</span>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-8 max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          Needle Intelligence & Cost Optimization
        </h1>
        <p className="text-sm text-gray-400">
          Transforming transaction logs, waste registers, and inventory balances into actionable margins.
        </p>
      </div>

      {/* Operational Questions & Answers */}
      {insights && insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-accent" />
            Operational Explanations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight: any, idx: number) => (
              <div key={idx} className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 space-y-2">
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider">{insight.category} Insight ({insight.confidence}% Confidence)</span>
                <h3 className="text-white font-medium text-sm">{insight.question}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{insight.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Optimization & Subsitutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Most Expensive Inventory holdings */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            Highest Unit Cost Ingredients
          </h2>
          <div className="border border-white/10 bg-[#0A0A0A] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-gray-400">
              <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                <tr>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Cost per Unit</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3 text-right">Value Held</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cost?.mostExpensive.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-3 font-medium text-white">{item.name}</td>
                    <td className="p-3">₹{item.costPerUnit}/{item.unit}</td>
                    <td className="p-3">{item.currentStock} {item.unit}</td>
                    <td className="p-3 text-right font-semibold text-white">₹{item.totalValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waste Opportunities */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF453A]" />
            Waste Reduction Opportunities
          </h2>
          <div className="border border-white/10 bg-[#0A0A0A] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-gray-400">
              <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                <tr>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Qty Wasted</th>
                  <th className="p-3 text-right">Waste Cost (Est)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cost?.wasteOpportunities.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-3 font-medium text-white">{item.name}</td>
                    <td className="p-3">{item.qty} units</td>
                    <td className="p-3 text-right font-semibold text-[#FF453A]">₹{item.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Forecast Signals Table */}
      {forecasts && forecasts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Depletion & Reorder Forecasts</h2>
          <div className="border border-white/10 bg-[#0A0A0A] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-gray-400">
              <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                <tr>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Daily Consumption</th>
                  <th className="p-3">Days Remaining</th>
                  <th className="p-3">Reorder Point</th>
                  <th className="p-3">Suggested Reorder Qty</th>
                  <th className="p-3 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {forecasts.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="p-3 font-medium text-white">{item.name}</td>
                    <td className="p-3">{item.dailyConsumption} {item.unit}/day</td>
                    <td className="p-3">
                      <span className={item.daysRemaining <= 2 ? "text-[#FF453A] font-bold" : "text-white"}>
                        {item.daysRemaining} days
                      </span>
                    </td>
                    <td className="p-3">{item.reorderInDays <= 0 ? "Reorder Now" : `In ${item.reorderInDays} days`}</td>
                    <td className="p-3 font-semibold text-accent">{item.suggestedOrderQty > 0 ? `${item.suggestedOrderQty} ${item.unit}` : "—"}</td>
                    <td className="p-3 text-right">{item.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
