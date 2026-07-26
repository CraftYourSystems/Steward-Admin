"use client";

import React, { useState } from "react";
import { useMorningBriefing, useEndOfDayBriefing } from "@/hooks/useNeedleBriefing";
import { useNeedleAlerts, useNeedleRecommendations } from "@/hooks/useNeedleAdvisor";
import { DecisionCard } from "@/components/needle/DecisionCard";
import { ShieldCheck, Loader2, Sparkles, TrendingUp, Calendar, AlertTriangle } from "lucide-react";

export default function NeedleTodayPage() {
  const { data: morningBrief, isLoading: isMorningLoading } = useMorningBriefing();
  const { data: alerts, isLoading: isAlertsLoading } = useNeedleAlerts();
  const { data: recommendations, isLoading: isRecsLoading } = useNeedleRecommendations();

  if (isMorningLoading || isAlertsLoading || isRecsLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>Loading morning brief and signals...</span>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Narrative Operational Header / Greeting */}
      <div className="border border-white/10 bg-[#0A0A0A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Good Morning 👋</h2>
            <p className="text-gray-300 text-[15px] leading-relaxed max-w-3xl">
              Here is your daily brief. Yesterday revenue showed operational activity, and today we have critical recommendations to maintain margins and prevent stockouts. Review the details below.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left column (Alerts), Right column (Recommendations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Priority Alerts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <AlertTriangle className="w-5 h-5 text-[#FF9F0A]" />
            <h2 className="text-lg font-semibold text-white">Active Alerts & Risks</h2>
          </div>
          {alerts && alerts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {alerts.map((alert: any) => (
                <DecisionCard key={alert.id} decision={alert} />
              ))}
            </div>
          ) : (
            <div className="border border-white/5 bg-white/5 rounded-xl p-6 text-center text-gray-500 text-sm">
              No active operational alerts or risks detected.
            </div>
          )}
        </div>

        {/* Right Column: Recommendations & Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">Recommended Optimizations</h2>
          </div>
          {recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((rec: any) => (
                <DecisionCard key={rec.id} decision={rec} />
              ))}
            </div>
          ) : (
            <div className="border border-white/5 bg-white/5 rounded-xl p-6 text-center text-gray-500 text-sm">
              No recommendations available at this time.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
