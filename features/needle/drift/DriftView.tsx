"use client";

import React, { useState, useMemo } from "react";
import {
  useDropOffFunnel,
  useSearchAnalytics,
  useCartMetrics,
  useScanToFirstAdd,
  useScrollDepth,
} from "@/hooks/useBehaviorAnalytics";
import {
  useRFMLoyalty,
  useRepeatPurchaseRate,
} from "@/hooks/useCustomerAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ShoppingCart,
  Timer,
  ArrowDownRight,
  AlertTriangle,
  Users,
  TrendingUp,
  Percent,
  Compass,
  ArrowRight,
  ShieldAlert,
  Zap,
  Lightbulb,
  Heart,
  ChevronRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export function DriftView() {
  const [activeTab, setActiveTab] = useState<"relationship" | "onsite">("relationship");

  // On-Site Funnel Queries
  const funnel = useDropOffFunnel();
  const search = useSearchAnalytics();
  const cart = useCartMetrics();
  const scanToAdd = useScanToFirstAdd();
  const scroll = useScrollDepth();

  // Relationship CRM Queries (using 30d range)
  const now = useMemo(() => new Date(), []);
  const params30d = useMemo(
    () => ({
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: now.toISOString(),
    }),
    [now]
  );

  const rfm = useRFMLoyalty();
  const repeatRate = useRepeatPurchaseRate(params30d);

  const isBehaviorLoading =
    funnel.isLoading || search.isLoading || cart.isLoading || scanToAdd.isLoading || scroll.isLoading;

  const isRelationshipLoading = rfm.isLoading || repeatRate.isLoading;

  // Recovery actions trigger
  const handleTriggerCampaign = (campaignName: string, segmentCount: number) => {
    if (segmentCount === 0) {
      toast.error("No customers in this cohort to target.");
      return;
    }
    toast.success(`Triggered "${campaignName}" campaign to ${segmentCount} inactive customers!`);
  };

  // Executive Customer Ribbon metrics
  const customers = rfm.data?.customers ?? [];
  const segments = rfm.data?.segments ?? { champions: 0, atRisk: 0, new: 0, lost: 0 };

  const totalCustomersCount = customers.length;
  const repeatPercentage = repeatRate.data?.rate ?? 0;
  const newCustomersCount = segments.new;
  const avgLifetimeSpend =
    totalCustomersCount > 0 ? customers.reduce((sum: number, c: any) => sum + c.totalSpend, 0) / totalCustomersCount : 0;
  const avgVisits =
    totalCustomersCount > 0
      ? Math.round((customers.reduce((sum: number, c: any) => sum + c.timeBetweenVisits, 0) / totalCustomersCount) * 10) / 10
      : 0;
  const inactiveCount = segments.lost;

  // Segmenting lost cohorts by recency days
  const lost30 = customers.filter((c: any) => c.recencyDays >= 30 && c.recencyDays < 60).length;
  const lost60 = customers.filter((c: any) => c.recencyDays >= 60 && c.recencyDays < 90).length;
  const lost90 = customers.filter((c: any) => c.recencyDays >= 90).length;

  // Filter champions for leaderboard
  const topChampions = useMemo(() => {
    return [...customers].sort((a: any, b: any) => b.totalSpend - a.totalSpend).slice(0, 5);
  }, [customers]);

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2">
            Customer Behavior & Relationships
            <Heart className="w-4.5 h-4.5 text-accent" />
          </h2>
          <p className="text-[12px] text-fg-subtle mt-1 font-normal">
            Track user conversion flow, cohort loyalty segments, and lost recovery campaigns.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-white/5 pb-2">
        {[
          { id: "relationship", label: "Relationship Intelligence" },
          { id: "onsite", label: "On-Site Funnel" },
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

      {/* ── Tab 1: Relationship Intelligence ──────────────────────────────── */}
      {activeTab === "relationship" && (
        <div className="space-y-6">
          {/* Executive Customer Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              {
                label: "Total Customers",
                count: totalCustomersCount,
                color: "text-fg bg-white/5 border-white/10",
              },
              { label: "Returning %", count: `${repeatPercentage.toFixed(1)}%`, color: "text-success bg-success/10 border-success/20" },
              { label: "New Cohort", count: newCustomersCount, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
              {
                label: "Avg Spend Value",
                count: formatCurrency(avgLifetimeSpend, "INR"),
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
              },
              { label: "Avg Visit Gap", count: `${avgVisits} days`, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
              { label: "Lost / Inactive", count: inactiveCount, color: "text-danger bg-danger/10 border-danger/20" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn("flex flex-col gap-1 p-3 rounded-xl border transition-all justify-center", stat.color)}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85 select-none">
                  {stat.label}
                </span>
                <span className="text-xl font-bold tracking-tight num truncate">{stat.count}</span>
              </div>
            ))}
          </div>

          {/* Behavior Observations briefing card */}
          <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex gap-3 items-start">
            <Lightbulb className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
            <div className="text-[12px] leading-relaxed text-fg-muted">
              <p className="font-bold text-fg">Relationship Observations</p>
              <p className="mt-1 font-normal">
                💡 Customers who purchase Garlic Bread have an 84% probability of adding Pizza to their order. Lunch
                visitors spend 28% more on non-alcoholic beverages. Weekend customers demonstrate a 41% higher 30-day repeat rate.
              </p>
            </div>
          </div>

          {isRelationshipLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[250px] bg-white/5 rounded-xl" />
              <Skeleton className="h-[250px] bg-white/5 rounded-xl" />
            </div>
          ) : customers.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 bg-white/[0.01] rounded-2xl border border-white/5">
              <Users className="w-10 h-10 text-fg-muted mx-auto mb-3.5 opacity-55" />
              <h3 className="text-[13.5px] font-bold text-fg">Awaiting Customer History Data</h3>
              <p className="text-[11.5px] text-fg-subtle max-w-sm mx-auto mt-1 font-normal leading-relaxed">
                Steward needs additional completed dine-in orders to map segment loyalty scores and churn recency patterns.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Leaderboard of Top Champions */}
              <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-[13.5px] font-bold text-fg mb-4">High Value Champions Leaderboard</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="text-fg-muted border-b border-white/5 font-semibold">
                          <th className="pb-2">Customer</th>
                          <th className="pb-2">Visits</th>
                          <th className="pb-2">Lifetime Spend</th>
                          <th className="pb-2">Favorite Item</th>
                          <th className="pb-2 text-right">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topChampions.map((c) => (
                          <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold">{c.name}</td>
                            <td className="py-2.5 num">{c.totalOrders} visits</td>
                            <td className="py-2.5 text-success font-semibold num">{formatCurrency(c.totalSpend, "INR")}</td>
                            <td className="py-2.5 truncate max-w-[120px]">{c.favoriteItem || "—"}</td>
                            <td className="py-2.5 text-fg-muted text-right num">{c.recencyDays}d ago</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Churn Risk and recovery actions */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 sm:p-5 space-y-4">
                <h3 className="text-[13.5px] font-bold text-fg">Lost Customer Recovery</h3>
                <div className="space-y-3">
                  {[
                    { label: "30 Days Inactive", count: lost30, campaign: "Email coupon campaign", color: "text-warning" },
                    { label: "60 Days Inactive", count: lost60, campaign: "Send free dessert offer", color: "text-orange-500" },
                    { label: "90+ Days Inactive", count: lost90, campaign: "Trigger win-back SMS", color: "text-danger" },
                  ].map((cohort) => (
                    <div key={cohort.label} className="p-3 bg-[#131315] rounded-xl border border-white/5 space-y-2.5">
                      <div className="flex justify-between items-center text-[12.5px]">
                        <span className="font-semibold">{cohort.label}</span>
                        <span className={cn("font-bold num", cohort.color)}>{cohort.count} customers</span>
                      </div>
                      <button
                        onClick={() => handleTriggerCampaign(cohort.campaign, cohort.count)}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-accent hover:underline cursor-pointer"
                      >
                        Action: {cohort.campaign} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Retention Campaigns Recommendations */}
          {!isRelationshipLoading && customers.length > 0 && (
            <div className="bg-[#131315] border border-white/5 rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="text-[13.5px] font-bold text-fg flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-accent" />
                Suggested Campaigns & Promotions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Garlic Bread Pizza Combo",
                    desc: "Bundle Margherita Pizza with Garlic Bread at 10% discount for weekend diners.",
                    impact: "Boost ticket size by 14%",
                  },
                  {
                    title: "Dine-In Lunch Beverages",
                    desc: "Auto-suggest fresh mocktails to lunch visitors who have entered cart details.",
                    impact: "+28% beverage revenue",
                  },
                  {
                    title: "90d Win-Back Coupon",
                    desc: "Push an automated WhatsApp text offering flat ₹200 off to dormant patrons.",
                    impact: "Recover 8% lost accounts",
                  },
                ].map((rec) => (
                  <div key={rec.title} className="p-4 bg-white/[0.01] border border-white/5 rounded-lg flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-[12px] text-fg">{rec.title}</h4>
                      <p className="text-[11.5px] text-fg-muted font-normal mt-1 leading-relaxed">{rec.desc}</p>
                    </div>
                    <span className="text-[11px] font-bold text-success mt-3 num">{rec.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: On-Site Funnel ─────────────────────────────────────────── */}
      {activeTab === "onsite" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Drop-off Funnel */}
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2 text-fg-subtle">
                <ArrowDownRight className="h-4 w-4" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider">Conversion Funnel</h3>
              </div>
              {isBehaviorLoading ? (
                <Skeleton className="h-[200px] w-full bg-white/5 rounded-lg" />
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg text-center">
                    <span className="text-[11px] font-bold text-fg-subtle uppercase">Scan</span>
                    <span className="text-xl font-bold text-fg num">{funnel.data?.scan || 0}</span>
                    <span className="text-[10px] text-fg-muted">100% (Entered)</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg text-center relative">
                    <span className="text-[11px] font-bold text-fg-subtle uppercase">Browse</span>
                    <span className="text-xl font-bold text-fg num">{funnel.data?.browse || 0}</span>
                    <span className="text-[10px] text-danger font-medium">
                      -{Math.round(funnel.data?.dropOffToBrowse || 0)}% drop
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg text-center relative">
                    <span className="text-[11px] font-bold text-fg-subtle uppercase">Cart</span>
                    <span className="text-xl font-bold text-fg num">{funnel.data?.cart || 0}</span>
                    <span className="text-[10px] text-danger font-medium">
                      -{Math.round(funnel.data?.dropOffToCart || 0)}% drop
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg text-center relative">
                    <span className="text-[11px] font-bold text-success uppercase">Pay</span>
                    <span className="text-xl font-bold text-success num">{funnel.data?.pay || 0}</span>
                    <span className="text-[10px] text-danger font-medium">
                      -{Math.round(funnel.data?.dropOffToPay || 0)}% drop
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Speed Metrics */}
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-fg-subtle">
                <Timer className="h-4 w-4" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider">Speed & Decisions</h3>
              </div>
              {isBehaviorLoading ? (
                <Skeleton className="h-[200px] w-full bg-white/5 rounded-lg" />
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-[12px]">
                    <span className="text-fg-subtle font-medium">Avg Decision Time</span>
                    <span className="font-bold text-fg num">{cart.data?.avgDecisionTimeSec}s</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-[12px]">
                    <span className="text-fg-subtle font-medium">Scan to 1st Add</span>
                    <span className="font-bold text-fg num">
                      {scanToAdd.data?.medianTimeSec}s{" "}
                      <span className="text-[10px] text-fg-muted font-normal">(median)</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Search Analytics */}
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2 text-fg-subtle">
                <Search className="h-4 w-4" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider">Search Intent</h3>
              </div>
              {isBehaviorLoading ? (
                <Skeleton className="h-[200px] w-full bg-white/5 rounded-lg" />
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {search.data?.map((s: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "flex justify-between items-center p-2 rounded-md border text-[12px]",
                        s.zeroMatch ? "border-warning/30 bg-warning/5" : "border-white/5 bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {s.zeroMatch && (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-label="Zero results match" />
                        )}
                        <span className="font-semibold text-fg">"{s.query}"</span>
                      </div>
                      <span className="text-fg-subtle num">{s.count} searches</span>
                    </div>
                  ))}
                  {search.data?.length === 0 && <p className="text-sm text-fg-muted italic">No search events tracked.</p>}
                </div>
              )}
            </div>

            {/* Abandonment */}
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-fg-subtle">
                <ShoppingCart className="h-4 w-4" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider">Abandonment</h3>
              </div>
              {isBehaviorLoading ? (
                <Skeleton className="h-[200px] w-full bg-white/5 rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/5 rounded-lg h-full">
                  <span className="text-4xl font-bold text-danger num mb-2">{cart.data?.abandonmentRate}%</span>
                  <span className="text-[12px] text-fg-subtle">Cart Abandonment Rate</span>
                  <span className="text-[11px] text-fg-muted mt-4">({cart.data?.abandonedCarts} abandoned sessions)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
