"use client";

import { useCompositeScores } from "@/hooks/useScoring";
import { cn } from "@/lib/utils";
import { Activity, Briefcase, ChefHat, Sparkles, AlertCircle, Info } from "lucide-react";

function ScoreRing({ score, label, icon: Icon, colorClass, size = "sm" }: any) {
  const isLg = size === "lg";
  const strokeW = isLg ? 6 : 4;
  const radius = isLg ? 45 : 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={cn("relative flex items-center justify-center", isLg ? "w-32 h-32" : "w-16 h-16")}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-white/10"
            strokeWidth={strokeW}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50%"
            cy="50%"
          />
          <circle
            className={cn("transition-all duration-1000 ease-out", colorClass)}
            strokeWidth={strokeW}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50%"
            cy="50%"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isLg && <Icon className="w-5 h-5 mb-1 opacity-50" />}
          <span className={cn("font-bold tracking-tight", isLg ? "text-3xl" : "text-sm")}>{score}</span>
        </div>
      </div>
      <div className={cn("font-medium text-center mt-2", isLg ? "text-sm text-fg" : "text-[10px] text-fg-subtle max-w-[80px] leading-tight")}>
        {label}
      </div>
    </div>
  );
}

export function CompositeScoringWidget() {
  const { data, isLoading } = useCompositeScores();

  if (isLoading) {
    return (
      <div className="glass-card p-5 animate-pulse h-[220px]">
        <div className="h-5 w-40 bg-white/10 rounded mb-4" />
        <div className="flex justify-between items-center h-full">
          <div className="w-32 h-32 rounded-full bg-white/10" />
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10" />
            <div className="w-16 h-16 rounded-full bg-white/10" />
            <div className="w-16 h-16 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const bh = data.businessHealthIndex?.score || 0;
  const eff = data.restaurantEfficiency?.score || 0;
  const kit = data.kitchenHealth?.score || 0;
  
  const getColor = (s: number) => s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "text-danger";

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Business Health Index
          </h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">Composite 4-pillar analysis</p>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-fg-muted cursor-help" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-surface-2 border border-white/10 rounded-xl shadow-xl text-xs text-fg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
            <div className="font-semibold mb-2">Index Weighting</div>
            <ul className="space-y-1 text-fg-subtle">
              <li>• 25% Financial (Profit, Growth)</li>
              <li>• 25% Operational (Efficiency)</li>
              <li>• 25% Customer (Retention)</li>
              <li>• 25% Growth (Acquisition)</li>
            </ul>
            {data.businessHealthIndex?.flags?.financial && (
              <div className="mt-2 text-warning flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{data.businessHealthIndex.flags.financial}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 mt-2">
        <ScoreRing score={bh} label="Overall Health" icon={Briefcase} colorClass={getColor(bh)} size="lg" />
        
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <ScoreRing score={kit} label="Kitchen Health" icon={ChefHat} colorClass={getColor(kit)} size="sm" />
          <ScoreRing score={eff} label="Efficiency" icon={Activity} colorClass={getColor(eff)} size="sm" />
          
          <div className="relative group cursor-not-allowed">
            <ScoreRing score={0} label="AI Insights" icon={Sparkles} colorClass="text-fg-muted/30" size="sm" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-bold text-center px-1 leading-tight text-white drop-shadow-md">
                Needs<br/>Insights
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}