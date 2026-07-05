"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { RefreshCw, Users, Repeat, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

import { KpiCard } from "@/components/analytics/KpiCard";
import { NewVsReturningChart } from "@/components/customers/NewVsReturningChart";
import { VisitFrequencyHistogram } from "@/components/customers/VisitFrequencyHistogram";
import { CohortRetentionGrid } from "@/components/customers/CohortRetentionGrid";
import { AverageSpendChart } from "@/components/customers/AverageSpendChart";
import { RFMSegmentationChart } from "@/components/customers/RFMSegmentationChart";
import { CustomerIntelligenceTable } from "@/components/customers/CustomerIntelligenceTable";
import { CustomerJourneyFunnel } from "@/components/customers/CustomerJourneyFunnel";

import {
  useNewVsReturning,
  useRepeatPurchaseRate,
  useVisitFrequency,
  useCohortRetention,
  useAverageSpendTrend,
  useRFMLoyalty,
  useCustomerJourney
} from "@/hooks/useCustomerAnalytics";

type QuickRange = "30d" | "90d" | "180d";
const ISO = (d: Date) => d.toISOString();

function getRange(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  switch (range) {
    case "30d":
      return { from: ISO(startOfDay(subDays(now, 29))), to: ISO(endOfDay(now)) };
    case "90d":
      return { from: ISO(startOfDay(subDays(now, 89))), to: ISO(endOfDay(now)) };
    case "180d":
    default:
      return { from: ISO(startOfDay(subDays(now, 179))), to: ISO(endOfDay(now)) };
  }
}

const QUICK_RANGES: { label: string; value: QuickRange }[] = [
  { label: "30D",  value: "30d" },
  { label: "90D",  value: "90d" },
  { label: "180D", value: "180d" },
];

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const [activeRange, setActiveRange] = useState<QuickRange>("90d");
  const [activeTab, setActiveTab] = useState<"overview" | "intelligence">("overview");
  const params = useMemo(() => getRange(activeRange), [activeRange]);

  const newVsReturning = useNewVsReturning(params);
  const repeatRate = useRepeatPurchaseRate(params);
  const visitFreq = useVisitFrequency(params);
  const cohort = useCohortRetention();
  const spendTrend = useAverageSpendTrend(params);

  // Intelligence Data
  const rfm = useRFMLoyalty();
  const journey = useCustomerJourney();

  const isFetching = 
    newVsReturning.isFetching || 
    repeatRate.isFetching || 
    visitFreq.isFetching || 
    cohort.isFetching || 
    spendTrend.isFetching ||
    rfm.isFetching ||
    journey.isFetching;

  const handleManualRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["customer-new-vs-returning"] }),
      queryClient.invalidateQueries({ queryKey: ["customer-repeat-rate"] }),
      queryClient.invalidateQueries({ queryKey: ["customer-visit-frequency"] }),
      queryClient.invalidateQueries({ queryKey: ["customer-cohort-retention"] }),
      queryClient.invalidateQueries({ queryKey: ["customer-avg-spend-trend"] }),
      queryClient.invalidateQueries({ queryKey: ["customer-rfm-loyalty"] }),
      queryClient.invalidateQueries({ queryKey: ["customer-journey"] }),
    ]);
  }, [queryClient]);

  function RangeToggle() {
    return (
      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveRange(r.value)}
            className={cn(
              "h-7 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-150",
              activeRange === r.value
                ? "bg-white/5 text-fg border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Customers</h2>
          <p className="text-[12px] text-fg-subtle mt-1">
            Retention, engagement, and intelligence analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isFetching}
            title="Refresh analytics"
            className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-white/5 text-fg-muted hover:text-fg hover:border-white/10 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </button>
          <RangeToggle />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex space-x-1 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
            activeTab === "overview" ? "bg-white/10 text-fg border-b-2 border-primary" : "text-fg-muted hover:text-fg"
          )}
        >
          Overview & Retention
        </button>
        <button
          onClick={() => setActiveTab("intelligence")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
            activeTab === "intelligence" ? "bg-white/10 text-fg border-b-2 border-primary" : "text-fg-muted hover:text-fg"
          )}
        >
          Customer Intelligence (Phase 7)
        </button>
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-5 mt-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              title="Total Registered Customers"
              value={repeatRate.data?.totalCustomers !== undefined ? String(repeatRate.data.totalCustomers) : "0"}
              icon={Users}
              loading={repeatRate.isLoading}
              description="Unique customers with phone numbers"
              accent="info"
            />
            <KpiCard
              title="Repeat Purchase Rate"
              value={repeatRate.data?.rate !== undefined ? `${repeatRate.data.rate}%` : "0%"}
              icon={Repeat}
              loading={repeatRate.isLoading}
              description="Customers with 2+ orders in period"
              accent="success"
            />
            <KpiCard
              title="Median Monthly Visits"
              value={visitFreq.data?.median !== undefined ? String(visitFreq.data.median) : "0"}
              icon={TrendingUp}
              loading={visitFreq.isLoading}
              description="Orders per month per active customer"
              accent="warning"
            />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle mt-6 mb-2">
            Acquisition & Frequency
          </p>

          <div className="grid gap-3 lg:grid-cols-2">
            <NewVsReturningChart data={newVsReturning.data} loading={newVsReturning.isLoading} />
            <VisitFrequencyHistogram data={visitFreq.data} loading={visitFreq.isLoading} />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle mt-6 mb-2">
            Retention & Value
          </p>

          <div className="grid gap-3 lg:grid-cols-2">
            <AverageSpendChart data={spendTrend.data} loading={spendTrend.isLoading} />
            <CohortRetentionGrid data={cohort.data} loading={cohort.isLoading} />
          </div>
        </div>
      )}

      {/* ── Intelligence Tab ──────────────────────────────────────────────────── */}
      {activeTab === "intelligence" && (
        <div className="space-y-4 sm:space-y-5 mt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <RFMSegmentationChart data={rfm.data} loading={rfm.isLoading} />
            <CustomerJourneyFunnel data={journey.data} loading={journey.isLoading} />
          </div>
          
          <div className="w-full">
            <CustomerIntelligenceTable data={rfm.data} loading={rfm.isLoading} />
          </div>
        </div>
      )}
    </div>
  );
}
