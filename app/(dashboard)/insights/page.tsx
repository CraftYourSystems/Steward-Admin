"use client";

import { useInsights, useGenerateInsights, useUpdateInsightStatus } from "@/hooks/useInsights";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, AlertOctagon, TrendingDown, Target, Lightbulb, Zap, ArrowRight, Check, X, RefreshCw } from "lucide-react";
import { useState } from "react";

const CATEGORY_ICONS: any = {
  THRESHOLD: AlertOctagon,
  TREND: TrendingDown,
  COMPARISON: Target,
  CORRELATION: Brain,
  OPPORTUNITY: Lightbulb
};

const PRIORITY_COLORS: any = {
  CRITICAL: "bg-danger/10 text-danger border-danger/20",
  HIGH: "bg-warning/10 text-warning border-warning/20",
  MEDIUM: "bg-info/10 text-info border-info/20",
  LOW: "bg-surface-3 text-fg-muted border-border"
};

function InsightCard({ insight }: { insight: any }) {
  const { mutate: updateStatus, isPending } = useUpdateInsightStatus();
  const Icon = CATEGORY_ICONS[insight.category] || Sparkles;

  return (
    <div className="rounded-[20px] bg-surface border border-white/10 p-5 sm:p-6 relative group overflow-hidden transition-all hover:border-white/20">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border", PRIORITY_COLORS[insight.priority])}>
              {insight.priority} Priority
            </span>
            <span className="text-[11px] font-semibold text-fg-subtle flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-md border border-white/5">
              <Icon className="w-3 h-3" />
              {insight.category}
            </span>
            <span className="text-[10px] text-fg-muted ml-auto">
              {new Date(insight.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-fg mb-1">{insight.title}</h3>
          <p className="text-[13px] text-fg-muted mb-4">{insight.description}</p>
          
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex gap-3 items-start">
            <Zap className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">Recommended Action</h4>
              <p className="text-[14px] font-medium text-fg">{insight.recommendedAction}</p>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
          <button 
            onClick={() => updateStatus({ id: insight.id, status: "DONE" })}
            disabled={isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-success/10 hover:bg-success/20 text-success border border-success/20 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Done
          </button>
          <button 
            onClick={() => updateStatus({ id: insight.id, status: "DISMISSED" })}
            disabled={isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-2 hover:bg-surface-3 text-fg-muted hover:text-fg rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50 border border-white/5"
          >
            <X className="w-4 h-4" /> Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { data: insights, isLoading } = useInsights();
  const { mutate: generate, isPending: isGenerating } = useGenerateInsights();

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-6 max-w-[1000px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
            Actionable Insights
            <Brain className="w-5 h-5 text-accent" />
          </h2>
          <p className="text-[13px] text-fg-subtle mt-1">AI-driven operational recommendations.</p>
        </div>
        <button
          onClick={() => generate()}
          disabled={isGenerating || isLoading}
          className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 rounded-full px-4 py-2 text-[13px] font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          Run Engine
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-fg-muted animate-pulse">Scanning operational data...</div>
      ) : !insights || insights.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-[20px] border border-white/10">
          <Sparkles className="w-10 h-10 text-fg-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-fg">No active insights</h3>
          <p className="text-sm text-fg-muted max-w-md mx-auto mt-2">
            Your restaurant is running perfectly. Check back later or run the engine to scan for new optimization opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((i: any) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      )}
    </div>
  );
}