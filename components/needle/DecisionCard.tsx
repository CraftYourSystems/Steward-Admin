import React from "react";
import Link from "next/link";
import { Sparkles, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// In Phase 2, this will be imported from our Prisma schema or shared types
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
  observation: string;
  evidence: string[];
  impact: string;
  confidence: number;
  recommendation: string;
  action: DecisionAction;
  sourceModule: string;
  urgency: Urgency;
  status: "ACTIVE" | "RESOLVED" | "DISMISSED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
}

interface DecisionCardProps {
  decision: Decision;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function DecisionCard({ decision, onDismiss, className }: DecisionCardProps) {
  // Map urgency to visual cues
  const urgencyConfig = {
    CRITICAL: { color: "text-[#FF453A]", bg: "bg-[#FF453A]/10", border: "border-[#FF453A]/20", icon: AlertTriangle },
    HIGH: { color: "text-[#FF9F0A]", bg: "bg-[#FF9F0A]/10", border: "border-[#FF9F0A]/20", icon: AlertTriangle },
    MEDIUM: { color: "text-[#32D74B]", bg: "bg-[#32D74B]/10", border: "border-[#32D74B]/20", icon: Info },
    LOW: { color: "text-gray-400", bg: "bg-white/5", border: "border-white/10", icon: Info },
  };

  const config = urgencyConfig[decision.urgency] || urgencyConfig.LOW;
  const UrgencyIcon = config.icon;

  return (
    <div className={cn("border border-white/10 bg-[#0A0A0A] rounded-xl p-5 shadow-sm transition-all hover:border-white/20 flex flex-col group relative", className)}>
      
      {/* Header: Urgency & Confidence */}
      <div className="flex justify-between items-start mb-4">
        <div className={cn("px-2 py-1 rounded flex items-center gap-1.5 border text-[11px] font-bold uppercase tracking-wider", config.bg, config.color, config.border)}>
          <UrgencyIcon className="w-3.5 h-3.5" />
          {decision.urgency}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            {decision.confidence}% Conf.
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

      {/* Core Insight */}
      <div className="mb-5 flex-1">
        <h3 className="text-white text-[15px] font-medium leading-snug mb-2">
          {decision.observation}
        </h3>
        
        {decision.evidence.length > 0 && (
          <ul className="text-gray-400 text-sm list-disc pl-4 space-y-1 mt-2">
            {decision.evidence.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Recommendation & Impact */}
      <div className="bg-white/5 border border-white/5 rounded-lg p-3.5 mb-5">
        <div className="flex items-center gap-1.5 mb-1 text-white text-[13px] font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#32D74B]" />
          Recommendation
        </div>
        <p className="text-gray-300 text-[13px] mb-2.5 leading-relaxed pl-5">
          {decision.recommendation}
        </p>
        
        {decision.impact && (
          <div className="pl-5 border-l-2 border-[#FF453A]/30 ml-2 py-0.5">
            <p className="text-gray-400 text-[12px]">
              <span className="font-semibold text-gray-300">Impact: </span>
              {decision.impact}
            </p>
          </div>
        )}
      </div>

      {/* Action Router */}
      <div className="flex justify-end gap-3 mt-auto">
        <Link 
          href={decision.action.destinationUrl}
          className="bg-white text-black hover:bg-gray-200 transition-colors text-sm font-semibold py-2 px-4 rounded-md shadow-sm w-full text-center"
        >
          {decision.action.label}
        </Link>
      </div>
    </div>
  );
}
