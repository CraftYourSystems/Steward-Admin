"use client";

import React, { useState } from "react";
import { DecisionCard, Decision } from "@/components/needle/DecisionCard";
import { CheckCircle2, ShieldCheck, Sun, CloudRain, Clock, ArrowUpRight } from "lucide-react";

// Deterministic Health Score Breakdown
const healthBreakdown = {
  inventory: 25, // Max 25%
  kitchen: 20,   // Max 20%
  payments: 20,  // Max 20%
  internet: 10,  // Max 10%
  staff: 13,     // Max 15% (1 absent)
  equipment: 8,  // Max 10% (1 printer offline)
};
const totalHealthScore = Object.values(healthBreakdown).reduce((a, b) => a + b, 0); // 96%

const mockTodayDecisions: Decision[] = [
  {
    id: "dec_1",
    tenantId: "t_1",
    type: "ALERT",
    observation: "Kitchen thermal printer #2 disconnected.",
    evidence: ["No heartbeat signal received from Station #2 (Grill) in the last 15 minutes."],
    impact: "Orders sent to Grill station will fail to print tickets.",
    confidence: 99,
    recommendation: "Check power & Ethernet cable on Grill printer or restart unit.",
    action: {
      type: "NAVIGATE",
      label: "Troubleshoot Printer",
      destinationUrl: "/settings?tab=hardware"
    },
    sourceModule: "hardware_monitor",
    urgency: "CRITICAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: "dec_2",
    tenantId: "t_1",
    type: "WARNING",
    observation: "Tomatoes inventory reaching daily threshold.",
    evidence: ["Current stock: 4.2 kg. Expected lunch usage: 8.5 kg."],
    impact: "Risk of 86-ing Pasta & Salsa items during lunch peak.",
    confidence: 92,
    recommendation: "Approve quick restock from secondary vendor or local market.",
    action: {
      type: "NAVIGATE",
      label: "Approve Restock",
      destinationUrl: "/inventory"
    },
    sourceModule: "inventory_monitor",
    urgency: "HIGH",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: "dec_3",
    tenantId: "t_1",
    type: "TASK",
    observation: "Dosa Batter prep recommendation for lunch rush.",
    evidence: ["Rain forecasted for 1:00 PM (+35% increase in hot breakfast/tiffin items)."],
    impact: "Avoid 15-minute kitchen bottleneck during 1:00 PM peak.",
    confidence: 89,
    recommendation: "Prepare 10 additional batches of batter before 11:30 AM.",
    action: {
      type: "NAVIGATE",
      label: "Open Prep Sheet",
      destinationUrl: "/inventory?tab=prep"
    },
    sourceModule: "prep_planner",
    urgency: "MEDIUM",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  }
];

export default function NeedleTodayPage() {
  const [quietMode, setQuietMode] = useState(false);
  const activeDecisions = quietMode ? [] : mockTodayDecisions;

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Dev Toggle for Quiet Mode */}
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs text-gray-500 font-mono">NEEDLE PROMISE DEMO</span>
        <button 
          onClick={() => setQuietMode(!quietMode)}
          className="text-xs text-accent hover:underline font-medium"
        >
          {quietMode ? "Simulate Active Operational Signals" : "Simulate 'No News is Good News' (Quiet Mode)"}
        </button>
      </div>

      {/* QUIET MODE STATE (No News is Good News) */}
      {quietMode ? (
        <div className="border border-white/10 bg-[#0D0D0D] rounded-2xl p-8 flex flex-col items-center text-center my-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center text-[#30D158] mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Good Morning 👋</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#30D158]/15 text-[#30D158] text-xs font-bold uppercase tracking-wider mb-4 border border-[#30D158]/30">
            🟢 Ready to Open • {totalHealthScore}% Operational Health
          </div>
          <p className="text-gray-400 text-sm max-w-md mb-8">
            Everything looks healthy. No critical issues or bottleneck signals detected. Needle will notify you if anything needs attention.
          </p>

          <div className="w-full max-w-2xl border-t border-white/10 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-gray-500 font-medium block mb-1">Forecasted Orders</span>
              <span className="text-xl font-bold text-white">184 Orders</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-gray-500 font-medium block mb-1">Peak Shift Window</span>
              <span className="text-xl font-bold text-white">12:15 PM – 2:00 PM</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-gray-500 font-medium block mb-1">Weather Forecast</span>
              <span className="text-xl font-bold text-white">Cloudy (Rain @ 6 PM)</span>
            </div>
          </div>
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
                    {totalHealthScore}% Operational
                  </span>
                </div>
                <p className="text-sm text-gray-400">Can I operate today? <span className="text-white font-medium">Yes. 1 hardware alert, 2 low-cost prep tasks.</span></p>
              </div>
            </div>

            {/* Health Deterministic Breakdown */}
            <div className="flex items-center gap-4 text-xs text-gray-400 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 w-full md:w-auto">
              <div><span className="text-white font-semibold">Inventory:</span> 25%</div>
              <div className="h-3 w-px bg-white/10" />
              <div><span className="text-white font-semibold">Kitchen:</span> 20%</div>
              <div className="h-3 w-px bg-white/10" />
              <div><span className="text-white font-semibold">Payments:</span> 20%</div>
              <div className="h-3 w-px bg-white/10" />
              <div><span className="text-white font-semibold">Equip:</span> 8%</div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">Morning Readiness & Low-Friction Tasks</h1>
                <p className="text-sm text-gray-400">Surface only actionable signals. (Capped at 3 max per section).</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">Showing 3 of 3 Signals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            {activeDecisions.slice(0, 3).map(decision => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
