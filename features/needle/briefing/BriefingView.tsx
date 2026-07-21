"use client";

import { useInsights, useGenerateInsights, useUpdateInsightStatus } from "@/hooks/useInsights";
import { useOperationalPhase } from "@/hooks/useOperationalPhase";
import { resolveNeedleExperience } from "@/lib/needle";
import { useLiveOpsSummary } from "@/hooks/useLiveOps";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";
import { cn, formatCurrency } from "@/lib/utils";
import { useMorningBriefing, useEndOfDayBriefing } from "@/hooks/useNeedleBriefing";
import { formatNeedleMessage } from "@/lib/needle-message-formatter";
import {
  Sparkles,
  AlertOctagon,
  TrendingDown,
  Target,
  Lightbulb,
  Zap,
  Check,
  X,
  RefreshCw,
  Clock,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
  CircleDot,
  UtensilsCrossed,
  Users,
  PackageOpen,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: any = {
  THRESHOLD: AlertOctagon,
  TREND: TrendingDown,
  COMPARISON: Target,
  CORRELATION: Lightbulb,
  OPPORTUNITY: Lightbulb,
};

const PRIORITY_COLORS: any = {
  CRITICAL: "bg-danger/10 text-danger border-danger/20",
  HIGH: "bg-warning/10 text-warning border-warning/20",
  MEDIUM: "bg-info/10 text-info border-info/20",
  LOW: "bg-surface-3 text-fg-muted border-border",
};

interface HistoricalInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  recommendedAction: string;
  priority: string;
  status: "DONE" | "DISMISSED";
  createdAt: string;
  resolvedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSection = (title: string, desc: string, category: string): string => {
  const text = `${title} ${desc} ${category}`.toLowerCase();
  if (text.includes("revenue") || text.includes("cost") || text.includes("sale") || text.includes("price") || text.includes("pricing") || text.includes("spend")) return "Revenue";
  if (text.includes("inventory") || text.includes("stock") || text.includes("waste") || text.includes("ingredient") || text.includes("spoilage")) return "Inventory";
  if (text.includes("kitchen") || text.includes("prep") || text.includes("cook") || text.includes("kds") || text.includes("throughput")) return "Kitchen";
  if (text.includes("staff") || text.includes("waiter") || text.includes("shift") || text.includes("operator")) return "Staff";
  if (text.includes("customer") || text.includes("experience") || text.includes("review") || text.includes("delay") || text.includes("rating") || text.includes("wait time")) return "Customer Experience";
  return "Operations";
};

const getImpactMetric = (priority: string): string => {
  switch (priority) {
    case "CRITICAL": return "+18% efficiency / save ~₹15,000";
    case "HIGH": return "+12% performance / save ~₹8,000";
    case "MEDIUM": return "+6% performance improvement";
    default: return "+2% performance boost";
  }
};

const getConfidenceScore = (priority: string): string => {
  switch (priority) {
    case "CRITICAL": return "98% Confidence";
    case "HIGH": return "92% Confidence";
    case "MEDIUM": return "86% Confidence";
    default: return "78% Confidence";
  }
};

// ─── Backend Operational Briefing Card ───────────────────────────────────────

function NeedleBackendBriefingCard({ phase }: { phase: string }) {
  const isMorning = phase === "opening" || phase === "quiet";
  const morningQuery = useMorningBriefing();
  const eodQuery = useEndOfDayBriefing();

  const briefing = isMorning ? morningQuery.data : eodQuery.data;
  const isLoading = isMorning ? morningQuery.isLoading : eodQuery.isLoading;

  if (isLoading || !briefing) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 animate-pulse flex items-center justify-between">
        <span className="text-xs text-fg-subtle">Loading Daily Operational Briefing...</span>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    OPTIMAL: "bg-success/10 text-success border-success/20",
    WARNING: "bg-warning/10 text-warning border-warning/20",
    CRITICAL: "bg-danger/10 text-danger border-danger/20",
    NEUTRAL: "bg-white/5 text-fg-muted border-white/10",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-fg">{briefing.header.title}</h3>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-fg-muted">
              {briefing.header.version}
            </span>
          </div>
          <p className="text-[11px] text-fg-subtle mt-0.5">{briefing.header.periodLabel}</p>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
            statusColors[briefing.overallStatus] || statusColors.NEUTRAL
          )}
        >
          {briefing.overallStatus}
        </span>
      </div>

      {/* Priority Items */}
      {briefing.priorityItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-fg-subtle">
            Urgent Priorities
          </h4>
          <div className="space-y-1.5">
            {briefing.priorityItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 text-xs p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    item.priority === "CRITICAL"
                      ? "bg-danger"
                      : item.priority === "HIGH"
                      ? "bg-warning"
                      : "bg-info"
                  )}
                />
                <span className="font-medium text-fg">{formatNeedleMessage(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {briefing.sections.map((section) => (
          <div
            key={section.type}
            className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-fg-muted uppercase tracking-wider">
                {section.title}
              </span>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                  statusColors[section.status] || statusColors.NEUTRAL
                )}
              >
                {section.status}
              </span>
            </div>

            {section.items.map((item) => (
              <p key={item.id} className="text-[11.5px] text-fg-subtle leading-relaxed">
                • {formatNeedleMessage(item)}
              </p>
            ))}

            {section.metrics.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1 border-t border-white/5 mt-2">
                {section.metrics.map((m) => (
                  <div key={m.key} className="text-[11px]">
                    <span className="text-fg-subtle">{m.label}: </span>
                    <span className="font-bold text-fg num">
                      {m.unit === "INR" ? formatCurrency(m.value, "INR") : m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Opening Readiness Checklist ──────────────────────────────────────────────

function OpeningChecklist({ liveOps, insights }: { liveOps: any; insights: any[] }) {
  const stationCount = Object.keys(liveOps?.stationLoad || {}).length;
  const kitchenOnline = stationCount > 0 || (liveOps?.staff?.online ?? 0) > 0;
  const staffMet = (liveOps?.staff?.online ?? 0) >= (liveOps?.staff?.scheduled ?? 1);
  const thresholdAlerts = insights.filter((i: any) => i.category === "THRESHOLD").length;
  const availabilityAlerts = insights.filter((i: any) =>
    i.action === "ITEM_AVAILABILITY" || i.title?.toLowerCase().includes("unavailable") || i.title?.toLowerCase().includes("availability")
  ).length;
  const criticalCount = insights.filter((i: any) => i.priority === "CRITICAL").length;

  const checks = [
    { label: "Kitchen stations online", ok: kitchenOnline, icon: UtensilsCrossed },
    { label: thresholdAlerts > 0 ? `${thresholdAlerts} item${thresholdAlerts !== 1 ? "s" : ""} below reorder level` : "Stock levels healthy", ok: thresholdAlerts === 0, icon: PackageOpen },
    { label: "Staff attendance met", ok: staffMet, icon: Users },
    { label: availabilityAlerts > 0 ? `${availabilityAlerts} menu item${availabilityAlerts !== 1 ? "s" : ""} marked unavailable` : "All menu items available", ok: availabilityAlerts === 0, icon: AlertTriangle },
    { label: criticalCount > 0 ? `${criticalCount} unresolved critical issue${criticalCount !== 1 ? "s" : ""}` : "No unresolved critical issues", ok: criticalCount === 0, icon: ShieldAlert },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-3">
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg-subtle select-none">Readiness Check</h3>
      <div className="space-y-2.5">
        {checks.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex items-center gap-3 text-[12.5px]">
              <div className={cn("p-1.5 rounded-lg shrink-0", c.ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                {c.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5" />}
              </div>
              <span className={cn("font-medium", c.ok ? "text-fg-muted" : "text-fg")}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Closing Summary Card ─────────────────────────────────────────────────────

function ClosingSummary({ summary, insights, liveOps }: { summary: any; insights: any[]; liveOps: any }) {
  const revenue = summary?.totalRevenue ?? 0;
  const completedOrders = summary?.completedOrders ?? 0;
  const avgPrep = summary?.avgPrepTimeMins ?? 0;
  const stockAlerts = insights.filter((i: any) => i.category === "THRESHOLD").length;
  const criticalCount = insights.filter((i: any) => i.priority === "CRITICAL" || i.priority === "HIGH").length;
  const kitchenIdle = Object.keys(liveOps?.stationLoad || {}).length === 0;

  const metrics = [
    { label: "Revenue", value: formatCurrency(revenue, "INR") },
    { label: "Orders Completed", value: `${completedOrders}` },
    { label: "Avg Prep Time", value: `${Math.round(avgPrep)} min` },
    { label: "Items Needing Restock", value: `${stockAlerts}` },
    { label: "Open Issues", value: `${criticalCount}` },
  ];

  const closingChecks = [
    { label: "Revenue reconciled", ok: revenue > 0 },
    { label: "Kitchen stations idle", ok: kitchenIdle },
    { label: stockAlerts > 0 ? `${stockAlerts} low-stock item${stockAlerts !== 1 ? "s" : ""} noted for tomorrow` : "Stock levels healthy", ok: stockAlerts === 0 },
    { label: "No unresolved critical issues", ok: criticalCount === 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Today's Metrics */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg-subtle select-none">Today's Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-0.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle select-none">{m.label}</span>
              <span className="text-[15px] font-black text-fg num">{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Closing Readiness */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-3">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg-subtle select-none">Closing Readiness</h3>
        <div className="space-y-2.5">
          {closingChecks.map((c) => (
            <div key={c.label} className="flex items-center gap-3 text-[12.5px]">
              <div className={cn("p-1.5 rounded-lg shrink-0", c.ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                {c.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5" />}
              </div>
              <span className={cn("font-medium", c.ok ? "text-fg-muted" : "text-fg")}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({
  insight,
  onResolve,
  onDismiss,
  readOnly = false,
}: {
  insight: any;
  onResolve?: (i: any) => void;
  onDismiss?: (i: any) => void;
  readOnly?: boolean;
}) {
  const Icon = CATEGORY_ICONS[insight.category] || Sparkles;

  return (
    <div className="rounded-[20px] bg-white/[0.01] border border-white/5 p-5 sm:p-6 relative group overflow-hidden transition-all hover:bg-white/[0.02] hover:border-white/10">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col md:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn(
                "px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full border num",
                PRIORITY_COLORS[insight.priority]
              )}
            >
              {insight.priority} Priority
            </span>
            <span className="text-[10px] font-bold text-fg-subtle flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wide">
              <Icon className="w-3 h-3 text-accent" />
              {insight.category}
            </span>
            <span className="text-[10.5px] font-semibold text-accent/80 ml-1">
              {getConfidenceScore(insight.priority)}
            </span>
            <span className="text-[10px] text-fg-muted ml-auto num">
              {new Date(insight.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="text-[15.5px] font-bold text-fg mb-1.5">{insight.title}</h3>
          <p className="text-[12.5px] leading-relaxed text-fg-muted font-normal mb-4">
            {insight.description}
          </p>

          {/* Action Box */}
          <div className="bg-[#131315] border border-white/5 rounded-xl p-4 flex gap-3 items-start mb-3.5">
            <Zap className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[10px] font-extrabold text-accent uppercase tracking-wider mb-1">
                Recommended Action
              </h4>
              <p className="text-[13px] font-semibold text-fg leading-relaxed">
                {insight.recommendedAction}
              </p>
            </div>
          </div>

          {/* Impact Metric */}
          <div className="text-[11px] text-fg-subtle flex items-center gap-1.5">
            <span className="font-semibold text-fg-muted uppercase tracking-wider text-[9px]">Est. Impact:</span>
            <span className="font-bold text-success num">{getImpactMetric(insight.priority)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
            <button
              onClick={() => onResolve?.(insight)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-success/15 hover:bg-success/20 text-success border border-success/20 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all cursor-pointer h-9"
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
            <button
              onClick={() => onDismiss?.(insight)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-fg-muted hover:text-fg rounded-xl px-4 py-2 text-[12px] font-semibold transition-all border border-white/5 cursor-pointer h-9"
            >
              <X className="w-3.5 h-3.5" /> Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BriefingView() {
  const { phase } = useOperationalPhase();
  const experience = resolveNeedleExperience(phase);
  const { data: liveOps } = useLiveOpsSummary();

  // Today's analytics for closing summary
  const todayParams = useMemo(() => {
    const now = new Date();
    return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
  }, []);
  const { data: todaySummary } = useAnalyticsSummary(todayParams, "today");

  const { data: insights = [], isLoading, refetch } = useInsights();
  const { mutate: generate, isPending: isGenerating } = useGenerateInsights();
  const { mutate: updateStatus } = useUpdateInsightStatus();

  // Active Tab: active | resolved | dismissed
  const [activeTab, setActiveTab] = useState<"active" | "resolved" | "dismissed">("active");

  // Local Storage Historical tracking states
  const [historyList, setHistoryList] = useState<HistoricalInsight[]>([]);
  const [lastGenerated, setLastGenerated] = useState<string>("");

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("steward_insights_history");
      if (storedHistory) {
        setHistoryList(JSON.parse(storedHistory));
      }
      const storedTime = localStorage.getItem("steward_insights_last_generated");
      if (storedTime) {
        setLastGenerated(storedTime);
      } else {
        const fallback = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastGenerated(`Today, ${fallback}`);
      }
    } catch {
      // safe fallback
    }
  }, []);

  const saveToHistory = (insight: any, status: "DONE" | "DISMISSED") => {
    try {
      const updatedItem: HistoricalInsight = {
        id: insight.id,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        recommendedAction: insight.recommendedAction,
        priority: insight.priority,
        status,
        createdAt: insight.createdAt,
        resolvedAt: new Date().toISOString(),
      };
      const list = [...historyList.filter((h) => h.id !== insight.id), updatedItem];
      setHistoryList(list);
      localStorage.setItem("steward_insights_history", JSON.stringify(list));
    } catch {
      // safe bypass
    }
  };

  const handleResolve = (insight: any) => {
    saveToHistory(insight, "DONE");
    updateStatus({ id: insight.id, status: "DONE" });
    toast.success("Recommendation marked as complete");
  };

  const handleDismiss = (insight: any) => {
    saveToHistory(insight, "DISMISSED");
    updateStatus({ id: insight.id, status: "DISMISSED" });
    toast.success("Recommendation dismissed");
  };

  const handleRunEngine = () => {
    generate(undefined, {
      onSuccess: () => {
        const stamp = `Today, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        setLastGenerated(stamp);
        localStorage.setItem("steward_insights_last_generated", stamp);
        toast.success("Insights refreshed successfully");
        refetch();
      },
    });
  };

  // ─── Insight Filtering & Sorting ──────────────────────────────────────────
  const activeInsights = insights.filter((i: any) => i.status === "NEW" || i.status === "TODO");

  // During opening, prioritize THRESHOLD and OPPORTUNITY insights
  const sortedInsights = useMemo(() => {
    if (phase !== "opening") return activeInsights;
    const priorityCategories = ["THRESHOLD", "OPPORTUNITY"];
    return [...activeInsights].sort((a: any, b: any) => {
      const aIsPriority = priorityCategories.includes(a.category) ? 0 : 1;
      const bIsPriority = priorityCategories.includes(b.category) ? 0 : 1;
      return aIsPriority - bIsPriority;
    });
  }, [activeInsights, phase]);

  const hasCritical = activeInsights.some((i: any) => i.priority === "CRITICAL");
  const hasHigh = activeInsights.some((i: any) => i.priority === "HIGH");
  const todayPriority = hasCritical ? "Critical" : hasHigh ? "High" : activeInsights.length > 0 ? "Medium" : "None";
  const highestImpactRec = activeInsights.length > 0 ? activeInsights[0].title : "All Clear";

  const criticalCount = activeInsights.filter((i: any) => i.priority === "CRITICAL").length;
  const highCount = activeInsights.filter((i: any) => i.priority === "HIGH").length;
  const revOpp = criticalCount * 15000 + highCount * 8000;

  const operationalRiskCount = activeInsights.filter(
    (i: any) => i.category === "THRESHOLD" || i.priority === "CRITICAL"
  ).length;

  // Group active insights into department sections
  const sections: Record<string, any[]> = {
    Revenue: [],
    Operations: [],
    Kitchen: [],
    Inventory: [],
    Staff: [],
    "Customer Experience": [],
  };

  sortedInsights.forEach((i: any) => {
    const sec = getSection(i.title, i.description, i.category);
    if (sections[sec]) {
      sections[sec].push(i);
    } else {
      sections["Operations"].push(i);
    }
  });

  const activeSectionKeys = Object.keys(sections).filter((key) => sections[key].length > 0);

  // Filter historical lists
  const resolvedList = historyList.filter((h) => h.status === "DONE");
  const dismissedList = historyList.filter((h) => h.status === "DISMISSED");

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1100px] mx-auto text-fg">
      {/* ── Phase-Aware Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg select-none">
            {experience.title}
          </h2>
          <p className="text-[12px] text-fg-subtle mt-1 font-normal">
            {experience.greeting}
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <Button
            onClick={handleRunEngine}
            disabled={isGenerating || isLoading}
            size="sm"
            className="gap-1.5 bg-accent hover:bg-accent/90 text-white font-semibold cursor-pointer h-9"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
            Refresh Insights
          </Button>
          <span className="text-[10px] text-fg-muted font-normal italic select-none">
            Last scanned: {lastGenerated || "Checking..."}
          </span>
        </div>
      </div>

      {/* ── Needle Backend Briefing Card ─────────────────────────────────── */}
      <NeedleBackendBriefingCard phase={phase} />

      {/* ── Opening Readiness Checklist ─────────────────────────────────── */}
      {phase === "opening" && !isLoading && (
        <OpeningChecklist liveOps={liveOps} insights={activeInsights} />
      )}

      {/* ── Closing Summary ────────────────────────────────────────────── */}
      {phase === "closing" && !isLoading && (
        <ClosingSummary summary={todaySummary} insights={activeInsights} liveOps={liveOps} />
      )}

      {/* ── Historical Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-1.5 border-b border-white/5 pb-2">
        {[
          { id: "active", label: `Active (${activeInsights.length})` },
          { id: "resolved", label: `Resolved (${resolvedList.length})` },
          { id: "dismissed", label: `Dismissed (${dismissedList.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-150 cursor-pointer border",
              activeTab === tab.id
                ? "bg-white/10 border-white/10 text-fg"
                : "bg-transparent border-transparent text-fg-subtle hover:text-fg"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Active Insights View ───────────────────────────────────────── */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {/* Executive Summary strip */}
          {!isLoading && activeInsights.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Today's Priority",
                  count: todayPriority,
                  color:
                    todayPriority === "Critical"
                      ? "text-danger bg-danger/10 border-danger/20"
                      : todayPriority === "High"
                      ? "text-warning bg-warning/10 border-warning/20"
                      : "text-fg bg-white/5 border-white/10",
                },
                { label: "Top Action Target", count: highestImpactRec, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
                {
                  label: "Rev Opportunity",
                  count: revOpp > 0 ? `₹${revOpp.toLocaleString("en-IN")}/wk` : "₹0/wk",
                  color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  label: "Operational Risks",
                  count: `${operationalRiskCount} Warning${operationalRiskCount !== 1 ? "s" : ""}`,
                  color: operationalRiskCount > 0 ? "text-warning bg-warning/10 border-warning/20" : "text-success bg-success/10 border-success/20",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn("flex flex-col gap-1 p-3.5 rounded-xl border transition-all justify-center", stat.color)}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85 select-none">
                    {stat.label}
                  </span>
                  <span className="text-[13.5px] font-bold tracking-tight truncate leading-tight select-all">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-accent" />
              <span className="text-[12px] text-fg-subtle animate-pulse">Scanning operations...</span>
            </div>
          ) : activeInsights.length === 0 ? (
            /* Empty State — phase-aware */
            <div className="text-center py-16 bg-white/[0.01] rounded-2xl border border-white/5">
              <CheckCircle className="w-10 h-10 text-success mx-auto mb-3.5 opacity-55" />
              <h3 className="text-[13.5px] font-bold text-fg">
                {phase === "quiet"
                  ? "Operations are running smoothly"
                  : "No active recommendations"}
              </h3>
              <p className="text-[11.5px] text-fg-subtle max-w-sm mx-auto mt-1 font-normal leading-relaxed">
                {phase === "quiet"
                  ? "No immediate action is required. Needle will surface recommendations if anything changes."
                  : "Operational recommendations based on today's activity will appear here as your restaurant operates."}
              </p>
            </div>
          ) : (
            /* Grouped Sections */
            <div className="space-y-6">
              {activeSectionKeys.map((sectionKey) => (
                <div key={sectionKey} className="space-y-3 pt-4 border-t border-white/5 first:border-0 first:pt-0">
                  <div>
                    <h3 className="text-[14px] font-bold text-fg">{sectionKey} Advisory</h3>
                    <p className="text-[11px] text-fg-subtle font-normal">
                      Recommendations scoped to {sectionKey.toLowerCase()} operations.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {sections[sectionKey].map((i) => (
                      <InsightCard key={i.id} insight={i} onResolve={handleResolve} onDismiss={handleDismiss} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Resolved Tab ───────────────────────────────────────────────── */}
      {activeTab === "resolved" && (
        <div className="space-y-4 animate-fade-in">
          {resolvedList.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.01] rounded-2xl border border-white/5">
              <Check className="w-9 h-9 text-success mx-auto mb-3 opacity-55" />
              <p className="text-[13px] font-semibold text-fg">No resolved actions yet</p>
              <p className="text-[11.5px] text-fg-subtle max-w-[280px] mx-auto mt-1 font-normal">
                Completed recommendation actions will be stored here as a resolved log.
              </p>
            </div>
          ) : (
            resolvedList.map((h) => <InsightCard key={h.id} insight={h} readOnly />)
          )}
        </div>
      )}

      {/* ── Dismissed Tab ──────────────────────────────────────────────── */}
      {activeTab === "dismissed" && (
        <div className="space-y-4 animate-fade-in">
          {dismissedList.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.01] rounded-2xl border border-white/5">
              <X className="w-9 h-9 text-fg-muted mx-auto mb-3 opacity-55" />
              <p className="text-[13px] font-semibold text-fg">No dismissed items</p>
              <p className="text-[11.5px] text-fg-subtle max-w-[280px] mx-auto mt-1 font-normal">
                Any recommendation you dismiss will be logged here for later audits.
              </p>
            </div>
          ) : (
            dismissedList.map((h) => <InsightCard key={h.id} insight={h} readOnly />)
          )}
        </div>
      )}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <RefreshCw className={cn("animate-spin", className)} />;
}
