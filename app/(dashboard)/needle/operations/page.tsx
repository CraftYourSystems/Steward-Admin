"use client";

import React from "react";
import { useNeedleAlerts, useNeedleRecommendations } from "@/hooks/useNeedleAdvisor";
import { DecisionCard } from "@/components/needle/DecisionCard";
import { AlertCircle, Loader2 } from "lucide-react";

export default function NeedleOperationsPage() {
  const { data: alerts, isLoading: isAlertsLoading } = useNeedleAlerts();
  const { data: recommendations, isLoading: isRecsLoading } = useNeedleRecommendations();

  if (isAlertsLoading || isRecsLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>Loading operational tasks...</span>
      </div>
    );
  }

  const allSignals = [...(alerts || []), ...(recommendations || [])];

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-accent" />
          Live Operations Engine
        </h1>
        <p className="text-sm text-gray-400">
          Continuous execution of restaurant operations rules. Critical and high-priority action items.
        </p>
      </div>

      {allSignals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allSignals.map((signal) => (
            <DecisionCard key={signal.id} decision={signal} />
          ))}
        </div>
      ) : (
        <div className="border border-white/10 bg-white/5 rounded-2xl p-12 text-center text-gray-500 max-w-md mx-auto my-12">
          Everything is running smoothly. No operational issues detected right now.
        </div>
      )}
    </div>
  );
}
