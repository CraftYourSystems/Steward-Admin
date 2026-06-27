"use client";

import { memo, useMemo } from "react";
import { Activity, XCircle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { HealthScoreData } from "@/types";

interface Props {
  data?: HealthScoreData;
  loading?: boolean;
}

const GRADE_COLORS: Record<string, { ring: string; text: string; bg: string }> = {
  Excellent:        { ring: "stroke-success", text: "text-success", bg: "bg-success/10" },
  Good:             { ring: "stroke-info",    text: "text-info",    bg: "bg-info/10" },
  "Needs Attention": { ring: "stroke-warning", text: "text-warning", bg: "bg-warning/10" },
  Critical:         { ring: "stroke-danger",  text: "text-danger",  bg: "bg-danger/10" },
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = GRADE_COLORS[grade] ?? GRADE_COLORS.Good;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="hsl(var(--surface-3))"
          strokeWidth="6"
        />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          className={cn("transition-all duration-700 ease-out", colors.ring)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-[28px] font-bold num leading-none", colors.text)}>
          {score}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-fg-subtle mt-1">
          / 100
        </span>
      </div>
    </div>
  );
}

function BreakdownRow({
  icon: Icon,
  label,
  score,
  max,
  detail,
}: {
  icon: typeof XCircle;
  label: string;
  score: number;
  max: number;
  detail: string;
}) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-3.5 w-3.5 text-fg-subtle shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-fg">{label}</span>
          <span className="text-[11px] num text-fg-muted">
            {score}/{max}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              pct >= 75 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-danger"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-fg-subtle mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

export const HealthScoreCard = memo(function HealthScoreCard({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <Skeleton className="h-4 w-36 mb-4 bg-surface-3" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-28 w-28 rounded-full bg-surface-3" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-full bg-surface-3 rounded" />
            <Skeleton className="h-8 w-full bg-surface-3 rounded" />
            <Skeleton className="h-8 w-full bg-surface-3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const colors = GRADE_COLORS[data.grade] ?? GRADE_COLORS.Good;
  const b = data.breakdown;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="grid place-items-center h-6 w-6 rounded-md bg-accent/10 border border-accent/20">
          <Activity className="h-3 w-3 text-accent" />
        </div>
        <span className="text-[13px] font-semibold text-fg">Restaurant Health</span>
        <span className={cn("ml-auto text-[11px] font-semibold rounded-full px-2 py-0.5", colors.bg, colors.text)}>
          {data.grade}
        </span>
      </div>

      {/* Score ring + breakdown */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <ScoreRing score={data.score} grade={data.grade} />

        <div className="flex-1 w-full space-y-3">
          <BreakdownRow
            icon={XCircle}
            label="Cancellation Rate"
            score={b.cancellation.score}
            max={b.cancellation.max}
            detail={`${b.cancellation.rate}% cancel rate`}
          />
          <BreakdownRow
            icon={Clock}
            label="Prep Speed"
            score={b.prepTime.score}
            max={b.prepTime.max}
            detail={`${b.prepTime.avgMins}m average`}
          />
          <BreakdownRow
            icon={TrendingUp}
            label="Sales Trend"
            score={b.salesTrend.score}
            max={b.salesTrend.max}
            detail={
              b.salesTrend.growthPct !== null
                ? `${b.salesTrend.growthPct > 0 ? "+" : ""}${b.salesTrend.growthPct}% vs last week`
                : "No previous data"
            }
          />
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-fg-subtle mt-3 pt-3 border-t border-border">
        Based on {data.periodLabel}. Score updates every 10 minutes.
      </p>
    </div>
  );
});
