import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  AlertTriangle, 
  AlertCircle, 
  CheckSquare, 
  TrendingUp, 
  Lightbulb, 
  Bot, 
  Bell, 
  X,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type RecommendationType = 
  | "ALERT" 
  | "WARNING" 
  | "TASK" 
  | "FORECAST" 
  | "INSIGHT" 
  | "AUTOMATION" 
  | "REMINDER";

export type Urgency = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface DecisionAction {
  type: string;
  label: string;
  destinationUrl: string;
  payload?: any;
}

export interface Decision {
  id: string;
  tenantId: string;
  type?: RecommendationType;
  observation: string;   // 1. What's happening?
  evidence: string[];    // 2. Why?
  impact: string;        // 3. What happens if ignored?
  confidence: number;    // 0-100 score
  recommendation: string;// 4. What can I do?
  action: DecisionAction;
  sourceModule: string;
  urgency: Urgency;
  status: "ACTIVE" | "RESOLVED" | "DISMISSED" | "EXPIRED" | "SUPPRESSED";
  createdAt: string;
  expiresAt: string;
}

interface DecisionCardProps {
  decision: Decision;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function DecisionCard({ decision, onDismiss, className }: DecisionCardProps) {
  const typeConfig: Record<RecommendationType, { label: string; icon: any; color: string; bg: string; border: string }> = {
    ALERT: { label: "Alert", icon: AlertTriangle, color: "text-[#FF453A]", bg: "bg-[#FF453A]/10", border: "border-[#FF453A]/20" },
    WARNING: { label: "Warning", icon: AlertCircle, color: "text-[#FF9F0A]", bg: "bg-[#FF9F0A]/10", border: "border-[#FF9F0A]/20" },
    TASK: { label: "Task", icon: CheckSquare, color: "text-[#30D158]", bg: "bg-[#30D158]/10", border: "border-[#30D158]/20" },
    FORECAST: { label: "Forecast", icon: TrendingUp, color: "text-[#64D2FF]", bg: "bg-[#64D2FF]/10", border: "border-[#64D2FF]/20" },
    INSIGHT: { label: "Insight", icon: Lightbulb, color: "text-[#BF5AF2]", bg: "bg-[#BF5AF2]/10", border: "border-[#BF5AF2]/20" },
    AUTOMATION: { label: "Automation", icon: Bot, color: "text-[#5E5CE6]", bg: "bg-[#5E5CE6]/10", border: "border-[#5E5CE6]/20" },
    REMINDER: { label: "Reminder", icon: Bell, color: "text-gray-300", bg: "bg-white/10", border: "border-white/20" },
  };

  const currentType = decision.type || "WARNING";
  const config = typeConfig[currentType];
  const TypeIcon = config.icon;

  return (
    <div className={cn("border border-white/10 bg-[#0A0A0A] rounded-xl p-5 shadow-sm transition-all hover:border-white/20 flex flex-col group relative", className)}>
      
      {/* Header: Type Tag & Confidence */}
      <div className="flex justify-between items-start mb-4">
        <div className={cn("px-2.5 py-1 rounded-md flex items-center gap-1.5 border text-[11px] font-semibold uppercase tracking-wider", config.bg, config.color, config.border)}>
          <TypeIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            {decision.confidence}% Confidence
          </span>
          {onDismiss && (
            <button 
              onClick={() => onDismiss(decision.id)}
              className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Question Breakdown */}
      <div className="space-y-4 mb-5 flex-1">
        
        {/* 1. What's happening? */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-0.5">What&apos;s Happening?</span>
          <h3 className="text-white text-[15px] font-medium leading-snug">
            {decision.observation}
          </h3>
        </div>

        {/* 2. Why? (Evidence) */}
        {decision.evidence.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-0.5">Why?</span>
            <ul className="text-gray-400 text-xs list-disc pl-4 space-y-0.5">
              {decision.evidence.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. What happens if ignored? (Impact) */}
        {decision.impact && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF453A] block mb-0.5">If Ignored</span>
            <p className="text-gray-300 text-xs leading-relaxed">
              {decision.impact}
            </p>
          </div>
        )}

        {/* 4. What can I do? (Recommendation) */}
        <div className="bg-white/5 border border-white/5 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-0.5">Recommended Action</span>
          <p className="text-white text-xs leading-relaxed">
            {decision.recommendation}
          </p>
        </div>
      </div>

      {/* Action Router */}
      <div className="flex justify-end gap-3 mt-auto">
        <Link 
          href={decision.action.destinationUrl}
          className="bg-white text-black hover:bg-gray-200 transition-colors text-xs font-semibold py-2 px-4 rounded-md shadow-sm w-full text-center"
        >
          {decision.action.label}
        </Link>
      </div>
    </div>
  );
}
