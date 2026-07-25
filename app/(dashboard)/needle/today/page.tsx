"use client";

import React from "react";
import { DecisionCard } from "@/components/needle/DecisionCard";
import { useMorningBriefing } from "@/hooks/useMorningBriefing";
import { ShieldCheck, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { translateBriefingItemToDecision } from "@/utils/needle-translator";
import { BriefingStatus } from "@/lib/needle-api";

export default function NeedleTodayPage() {
  const { data, isLoading } = useMorningBriefing();

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>Loading operational signals...</span>
      </div>
    );
  }

  const priorityItems = data?.priorityItems || [];
  const overallStatus = data?.overallStatus || "OPTIMAL";
  const sections = data?.sections || [];

  const getStatusColor = (status: BriefingStatus) => {
    switch (status) {
      case "CRITICAL": return "text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/30";
      case "WARNING": return "text-[#FF9F0A] bg-[#FF9F0A]/10 border-[#FF9F0A]/30";
      default: return "text-[#30D158] bg-[#30D158]/15 border-[#30D158]/30";
    }
  };

  const getStatusIcon = (status: BriefingStatus) => {
    switch (status) {
      case "CRITICAL": return <AlertTriangle className="w-6 h-6" />;
      case "WARNING": return <AlertCircle className="w-6 h-6" />;
      default: return <ShieldCheck className="w-6 h-6" />;
    }
  };

  const getStatusText = (status: BriefingStatus) => {
    switch (status) {
      case "CRITICAL": return "Critical Action Required";
      case "WARNING": return "Needs Attention";
      default: return "Ready to Open";
    }
  };

  const statusColorClass = getStatusColor(overallStatus);

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Empty State / Good Morning */}
      {priorityItems.length === 0 ? (
        <div className="border border-white/10 bg-[#0D0D0D] rounded-2xl p-8 flex flex-col items-center text-center my-6 shadow-xl">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${statusColorClass.split(' ')[1]} ${statusColorClass.split(' ')[0]} border ${statusColorClass.split(' ')[2]}`}>
            {getStatusIcon(overallStatus)}
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Good Morning 👋</h2>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${statusColorClass}`}>
            {overallStatus === 'OPTIMAL' ? '🟢' : (overallStatus === 'WARNING' ? '🟡' : '🔴')} {getStatusText(overallStatus)}
          </div>
          <p className="text-gray-400 text-sm max-w-md mb-8">
            {overallStatus === 'OPTIMAL' 
              ? "Everything looks healthy. No critical issues or bottleneck signals detected. Needle will notify you if anything needs attention."
              : "There are some minor alerts, but no priority signals require immediate intervention right now."}
          </p>

          <div className="w-full max-w-2xl border-t border-white/10 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {sections.slice(0, 3).map((section: any) => (
              <div key={section.type} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="text-xs text-gray-500 font-medium block mb-1">{section.title}</span>
                <span className={`text-sm font-bold ${section.status === 'OPTIMAL' ? 'text-white' : 'text-[#FF9F0A]'}`}>
                  {section.status === 'OPTIMAL' ? 'Healthy' : 'Check Required'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Morning Readiness Summary Banner */}
          <div className="border border-white/10 bg-[#0D0D0D] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-lg border ${statusColorClass}`}>
                {getStatusIcon(overallStatus)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">Restaurant Operational Status</h2>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColorClass}`}>
                    {getStatusText(overallStatus)}
                  </span>
                </div>
                <p className="text-sm text-gray-400">Can I operate today? <span className="text-white font-medium">{priorityItems.length} priority signals detected.</span></p>
              </div>
            </div>

            {/* Health Deterministic Breakdown */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 w-full md:w-auto">
              {sections.map((section: any, idx: number) => (
                <React.Fragment key={section.type}>
                  {idx > 0 && <div className="hidden md:block h-3 w-px bg-white/10" />}
                  <div>
                    <span className="text-white capitalize font-semibold">{section.title.split(' ')[0]}:</span>{" "}
                    <span className={section.status === 'OPTIMAL' ? 'text-[#30D158]' : (section.status === 'WARNING' ? 'text-[#FF9F0A]' : 'text-[#FF453A]')}>
                      {section.status}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">Morning Readiness & Low-Friction Tasks</h1>
                <p className="text-sm text-gray-400">Actionable signals generated by Needle rule engine.</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">Showing {priorityItems.length} Signals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            {priorityItems.map((item: any) => (
              <DecisionCard key={item.id} decision={translateBriefingItemToDecision(item)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
