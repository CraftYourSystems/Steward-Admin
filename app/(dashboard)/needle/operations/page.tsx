"use client";

import React from "react";
import { DecisionCard, Decision } from "@/components/needle/DecisionCard";
import { useNeedleSignals } from "@/hooks/useNeedleSignals";
import { Zap, Loader2, ShieldCheck } from "lucide-react";

export default function NeedleOperationsPage() {
  const { data, isLoading } = useNeedleSignals("operations");

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>Loading live operational signals...</span>
      </div>
    );
  }

  const signals = data?.signals || [];

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FF9F0A]" />
            <h1 className="text-xl font-semibold tracking-tight text-white">Live Service Operations</h1>
          </div>
          <p className="text-sm text-gray-400">Level 1 operational alerts requiring immediate intervention during shift.</p>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          DATA MODE: <span className="uppercase text-accent font-semibold">{data?.mode || "MOCK"}</span>
        </span>
      </div>

      {signals.length === 0 ? (
        <div className="border border-white/10 bg-[#0D0D0D] rounded-2xl p-8 flex flex-col items-center text-center my-6">
          <div className="w-12 h-12 rounded-full bg-[#30D158]/10 text-[#30D158] flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Kitchen & Service Running Smoothly</h2>
          <p className="text-gray-400 text-sm max-w-md">No live bottlenecks, printer errors, or order delay alerts detected.</p>
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
