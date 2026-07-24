"use client";

import React from "react";
import { DecisionCard, Decision } from "@/components/needle/DecisionCard";
import { useNeedleSignals } from "@/hooks/useNeedleSignals";
import { BarChart3, Loader2, Lightbulb } from "lucide-react";

export default function NeedleInsightsPage() {
  const { data, isLoading } = useNeedleSignals("insights");

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>Loading strategic insights...</span>
      </div>
    );
  }

  const signals = data?.signals || [];

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-semibold tracking-tight text-white">Business & Strategic Insights</h1>
          </div>
          <p className="text-sm text-gray-400">Level 3 intelligence: Weekly performance trends, labor ratio, and margin optimization. (Non-interruptive).</p>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          DATA MODE: <span className="uppercase text-accent font-semibold">{data?.mode || "MOCK"}</span>
        </span>
      </div>

      {signals.length === 0 ? (
        <div className="border border-white/10 bg-[#0D0D0D] rounded-2xl p-8 flex flex-col items-center text-center my-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-3">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">No Strategic Warnings</h2>
          <p className="text-gray-400 text-sm max-w-md">Weekly sales performance, margins, and labor trends are within normal operating ranges.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          {signals.map((decision: Decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  );
}
