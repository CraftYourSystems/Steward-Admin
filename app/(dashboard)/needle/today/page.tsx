"use client";

import React, { useState } from "react";
import { DecisionCard, Decision } from "@/components/needle/DecisionCard";
import { useNeedleSignals } from "@/hooks/useNeedleSignals";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function NeedleTodayPage() {
  const { data, isLoading } = useNeedleSignals("today");
  const [quietMode, setQuietMode] = useState(false);

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>Loading operational signals...</span>
      </div>
    );
  }

  const signals = quietMode ? [] : (data?.signals || []);
  const healthScore = data?.healthScore?.total || 100;
  const breakdown = data?.healthScore?.breakdown || {};
  const quietModeForecast = data?.quietModeForecast;

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Dev / Mode Indicator */}
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs text-gray-500 font-mono">
          DATA MODE: <span className="uppercase text-accent font-semibold">{data?.mode || "MOCK"}</span>
        </span>
        <button 
          onClick={() => setQuietMode(!quietMode)}
          className="text-xs text-accent hover:underline font-medium"
        >
          {quietMode ? "Simulate Active Operational Signals" : "Simulate 'No News is Good News' (Quiet Mode)"}
        </button>
      </div>

      {/* QUIET MODE STATE (No News is Good News) */}
      {quietMode || signals.length === 0 ? (
        <div className="border border-white/10 bg-[#0D0D0D] rounded-2xl p-8 flex flex-col items-center text-center my-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center text-[#30D158] mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Good Morning 👋</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#30D158]/15 text-[#30D158] text-xs font-bold uppercase tracking-wider mb-4 border border-[#30D158]/30">
            🟢 Ready to Open • {healthScore}% Operational Health
          </div>
          <p className="text-gray-400 text-sm max-w-md mb-8">
            Everything looks healthy. No critical issues or bottleneck signals detected. Needle will notify you if anything needs attention.
          </p>

          {quietModeForecast && (
            <div className="w-full max-w-2xl border-t border-white/10 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="text-xs text-gray-500 font-medium block mb-1">Forecasted Orders</span>
                <span className="text-xl font-bold text-white">{quietModeForecast.expectedOrders} Orders</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="text-xs text-gray-500 font-medium block mb-1">Peak Shift Window</span>
                <span className="text-xl font-bold text-white">{quietModeForecast.peakWindow}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="text-xs text-gray-500 font-medium block mb-1">Weather Forecast</span>
                <span className="text-xl font-bold text-white">{quietModeForecast.weather}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Morning Readiness Summary Banner */}
          <div className="border border-white/10 bg-[#0D0D0D] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">Restaurant Operational Status</h2>
                  <span className="bg-[#30D158]/15 text-[#30D158] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#30D158]/30">
                    {healthScore}% Operational
                  </span>
                </div>
                <p className="text-sm text-gray-400">Can I operate today? <span className="text-white font-medium">{data?.summaryText ? String(data.summaryText) : "Operational checks passed."}</span></p>
              </div>
            </div>

            {/* Health Deterministic Breakdown */}
            <div className="flex items-center gap-4 text-xs text-gray-400 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 w-full md:w-auto">
              {Object.entries(breakdown).map(([key, val], idx) => (
                <React.Fragment key={key}>
                  {idx > 0 && <div className="h-3 w-px bg-white/10" />}
                  <div>
                    <span className="text-white capitalize font-semibold">{key}:</span> {String(val)}%
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">Morning Readiness & Low-Friction Tasks</h1>
                <p className="text-sm text-gray-400">Surface only actionable signals. (Capped at 3 max per section).</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">Showing {signals.slice(0, 3).length} Signals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            {signals.slice(0, 3).map((decision: Decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
