"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { 
  RefreshCw, 
  Users, 
  Repeat, 
  TrendingUp, 
  Search, 
  Clipboard, 
  BookOpen, 
  Activity, 
  User, 
  Phone, 
  Star,
  FileText, 
  PenTool, 
  CheckCircle, 
  X, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

// Existing analytics components & hooks
import { NewVsReturningChart } from "@/components/customers/NewVsReturningChart";
import { VisitFrequencyHistogram } from "@/components/customers/VisitFrequencyHistogram";
import { CohortRetentionGrid } from "@/components/customers/CohortRetentionGrid";
import { AverageSpendChart } from "@/components/customers/AverageSpendChart";
import { RFMSegmentationChart } from "@/components/customers/RFMSegmentationChart";
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

export function CustomersView() {
  const queryClient = useQueryClient();

  const [activeRange, setActiveRange] = useState<QuickRange>("90d");
  const [activeTab, setActiveTab] = useState<string>("directory");
  const params = useMemo(() => getRange(activeRange), [activeRange]);

  // Analytics hooks
  const newVsReturning = useNewVsReturning(params, activeTab === "analytics");
  const repeatRate = useRepeatPurchaseRate(params);
  const visitFreq = useVisitFrequency(params, activeTab === "analytics");
  const cohort = useCohortRetention(activeTab === "analytics");
  const spendTrend = useAverageSpendTrend(params, activeTab === "analytics");
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

  // Local Guest Notes State
  const [guestNotes, setGuestNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("steward-customer-notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active Customer profile drawer state
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [noteEditVal, setNoteEditVal] = useState("");

  // Directory Filter States
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const customers = rfm.data?.customers ?? [];

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
    toast.success("Guest telemetry refreshed");
  }, [queryClient]);

  // Save guest notes to LocalStorage
  const handleSaveNote = (guestId: string, text: string) => {
    setGuestNotes((prev) => {
      const updated = { ...prev, [guestId]: text };
      try {
        localStorage.setItem("steward-customer-notes", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success("Guest preferences saved");
  };

  // Filtered & Sorted Directory list
  const filteredGuests = useMemo(() => {
    return customers.filter((c: any) => {
      const query = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        (c.id && c.id.toLowerCase().includes(query)) // fallback to ID / phone matching
      );
    });
  }, [customers, search]);

  const sortedGuests = useMemo(() => {
    return [...filteredGuests].sort((a, b) => {
      if (sortBy === "recency") {
        return a.recencyDays - b.recencyDays; // Smallest recencyDays = most recent visit first
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredGuests, sortBy]);

  // Derived Overview statistics
  const { totalCustomers, returningCount, newCount, avgOrders, activityStatus, activityDetail } = useMemo(() => {
    const total = customers.length;
    const returning = customers.filter((c: any) => c.totalOrders > 1).length;
    const brandNew = customers.filter((c: any) => c.segment === "New" || c.totalOrders === 1).length;
    const avg = total > 0 ? (customers.reduce((acc: number, c: any) => acc + c.totalOrders, 0) / total).toFixed(1) : "0";

    const isHealthy = returning > 0;
    const status = isHealthy ? "Healthy" : brandNew > returning ? "Growing" : "Needs Attention";
    let detail = "High repeat dining engagement.";
    if (status === "Needs Attention") {
      detail = "Low repeat booking rate.";
    } else if (status === "Growing") {
      detail = "High rate of new guest acquisition.";
    }

    return { totalCustomers: total, returningCount: returning, newCount: brandNew, avgOrders: avg, activityStatus: status, activityDetail: detail };
  }, [customers]);

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1.5 border-b border-white/5">
        <div>
          <div className="label-xs mb-1">Guest Registry</div>
          <h2 className="text-xl font-bold tracking-tight text-fg">Guest Relations</h2>
          <p className="text-[12px] text-fg-subtle mt-0.5">
            Identify repeat diners, customize service preferences, and track loyalty metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isFetching}
            title="Refresh database"
            className="flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-white/5 text-fg-muted hover:text-fg transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </button>
          {activeTab === "analytics" && (
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
              {QUICK_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setActiveRange(r.value)}
                  className={cn(
                    "h-7 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer",
                    activeRange === r.value
                      ? "bg-white/5 text-fg border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "text-fg-muted hover:text-fg"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="directory" onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-white/5 p-1 rounded-xl mb-5 border border-white/5">
          {[
            { value: "directory", label: "Guest Directory" },
            { value: "analytics", label: "Retention Analytics" },
            { value: "insights", label: "Customer Insights" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[12px] font-medium data-[state=active]:bg-white/10 data-[state=active]:text-fg rounded-lg px-4 py-1.5 transition-colors shadow-none data-[state=active]:shadow-none cursor-pointer"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Guest Directory (Primary Workspace) */}
        <TabsContent value="directory" className="space-y-5 mt-4">
          
          {/* Summary statistics Ribbon */}
          {!rfm.isLoading && customers.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Total Customers</span>
                <span className="text-xl font-black text-fg num mt-1">{totalCustomers}</span>
              </div>
              <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Returning Guests</span>
                <span className="text-xl font-black text-success num mt-1">{returningCount}</span>
              </div>
              <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">New Customers</span>
                <span className="text-xl font-black text-white/50 num mt-1">{newCount}</span>
              </div>
              <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Avg. Orders Per Guest</span>
                <span className="text-xl font-black text-fg num mt-1">{avgOrders}</span>
              </div>
              <div className={cn("col-span-2 lg:col-span-1 flex flex-col p-4 rounded-2xl border justify-center", activityStatus === "Healthy" ? "border-success/20 bg-success/5 text-success" : activityStatus === "Growing" ? "border-primary/20 bg-primary/5 text-primary" : "border-danger/20 bg-danger/5 text-danger")}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 select-none">Engagement</span>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-[15.5px] font-black tracking-tight mt-1">{activityStatus.toUpperCase()}</span>
                <span className="text-[10px] opacity-75 mt-0.5 font-normal truncate">{activityDetail}</span>
              </div>
            </div>
          )}

          {/* Unified Search & Sort Filter */}
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-3 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search guests by name or registration ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              >
                <option value="name">Alphabetical (Name)</option>
                <option value="recency">Most Recent Visit</option>
              </select>
              {search && (
                <Button variant="ghost" size="sm" className="h-10 text-[11px] px-2.5 hover:bg-white/5 text-fg-subtle" onClick={() => setSearch("")}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Guest Directory table */}
          <div className="card-premium overflow-hidden border border-white/5 rounded-2xl bg-white/[0.01]">
            {rfm.isLoading ? (
              <div className="space-y-1.5 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md bg-white/5" />
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-[13px] font-medium text-fg">No customers have been recorded yet.</p>
                <p className="text-[11px] text-fg-subtle">Customer profiles will appear automatically as orders are placed.</p>
              </div>
            ) : sortedGuests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-[13px] font-bold text-fg">No customers match your current search.</p>
                <p className="text-[11px] text-fg-subtle font-normal">Try adjusting your search or clearing filters.</p>
                <Button size="sm" variant="secondary" onClick={() => setSearch("")}>Reset Search</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Guest Name</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Last Visit</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Total Orders</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Service Notes</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGuests.map((c) => {
                      const isNew = c.segment === "New" || c.totalOrders <= 1;
                      const hasNote = !!guestNotes[c.id];

                      return (
                        <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.01] transition-colors cursor-pointer" onClick={() => { setSelectedGuest(c); setNoteEditVal(guestNotes[c.id] || ""); }}>
                          <TableCell className="py-3 font-semibold text-[13.5px] text-fg">{c.name}</TableCell>
                          <TableCell className="py-3">
                            <Badge variant={isNew ? "info" : "success"} className="text-[9.5px] font-bold tracking-wide uppercase">
                              {isNew ? "New" : "Returning"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-[12.5px] text-fg-muted num">
                            {c.recencyDays === 0 ? "Today" : c.recencyDays === 1 ? "Yesterday" : `${c.recencyDays} days ago`}
                          </TableCell>
                          <TableCell className="py-3 text-[12.5px] text-fg-muted font-bold num">{c.totalOrders}</TableCell>
                          <TableCell className="py-3">
                            {hasNote ? (
                              <Badge variant="warning" className="text-[9.5px] font-semibold gap-1">
                                <FileText className="w-2.5 h-2.5" /> Preference Logged
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-white/20 italic">None</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="sm" variant="secondary" className="h-8 text-[11px] bg-white/5 hover:bg-white/10 border-white/10" onClick={() => { setSelectedGuest(c); setNoteEditVal(guestNotes[c.id] || ""); }}>
                                View Profile
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Retention Analytics */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-5 mt-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Total Registered Customers</span>
              <span className="text-xl font-black text-fg num mt-1">{repeatRate.data?.totalCustomers !== undefined ? String(repeatRate.data.totalCustomers) : "0"}</span>
            </div>
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Repeat Purchase Rate</span>
              <span className="text-xl font-black text-success num mt-1">{repeatRate.data?.rate !== undefined ? `${repeatRate.data.rate}%` : "0%"}</span>
            </div>
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Median Monthly Visits</span>
              <span className="text-xl font-black text-warning num mt-1">{visitFreq.data?.median !== undefined ? String(visitFreq.data.median) : "0"}</span>
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle mt-6 mb-2">Acquisition & Frequency</p>
          <div className="grid gap-3 lg:grid-cols-2">
            <NewVsReturningChart data={newVsReturning.data} loading={newVsReturning.isLoading} />
            <VisitFrequencyHistogram data={visitFreq.data} loading={visitFreq.isLoading} />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle mt-6 mb-2">Retention & Value</p>
          <div className="grid gap-3 lg:grid-cols-2">
            <AverageSpendChart data={spendTrend.data} loading={spendTrend.isLoading} />
            <CohortRetentionGrid data={cohort.data} loading={cohort.isLoading} />
          </div>
        </TabsContent>

        {/* Tab 3: Customer Insights */}
        <TabsContent value="insights" className="space-y-4 sm:space-y-5 mt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <RFMSegmentationChart data={rfm.data} loading={rfm.isLoading} />
            <CustomerJourneyFunnel data={journey.data} loading={journey.isLoading} />
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Guest Profile Drawer Sheet ── */}
      <Sheet open={!!selectedGuest} onOpenChange={(open) => !open && setSelectedGuest(null)}>
        {selectedGuest && (
          <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg space-y-6">
            <SheetHeader className="pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <SheetTitle className="text-fg font-black text-lg">Guest Profile</SheetTitle>
              </div>
            </SheetHeader>

            {/* Profile Info Grid */}
            <div className="space-y-5">
              
              {/* Basic Information */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Guest Details</h4>
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4.5 space-y-3">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-fg-subtle flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Name</span>
                    <span className="font-bold text-white">{selectedGuest.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-fg-subtle flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Registry ID / Phone</span>
                    <span className="font-mono text-white/80 num">{selectedGuest.id}</span>
                  </div>
                </div>
              </div>

              {/* Dining Stats */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Dining & Visit Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                    <span className="text-[10px] text-fg-subtle block">Lifetime Orders</span>
                    <span className="text-lg font-black text-fg num block mt-0.5">{selectedGuest.totalOrders}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                    <span className="text-[10px] text-fg-subtle block">Lifetime Spend</span>
                    <span className="text-lg font-black text-accent num block mt-0.5">{formatCurrency(selectedGuest.totalSpend)}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                    <span className="text-[10px] text-fg-subtle block">Average Visit Gap</span>
                    <span className="text-[14.5px] font-bold text-fg num block mt-1">
                      {selectedGuest.totalOrders > 1 ? `${selectedGuest.timeBetweenVisits} days` : "N/A"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                    <span className="text-[10px] text-fg-subtle block">Loyalty Score</span>
                    <span className="text-[14.5px] font-bold text-success num block mt-1">{selectedGuest.loyaltyScore} / 100</span>
                  </div>
                </div>
              </div>

              {/* Flavor Profile */}
              {(selectedGuest.favoriteItem || selectedGuest.favoriteCategory) && (
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Flavor Profile</h4>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4.5 space-y-3">
                    {selectedGuest.favoriteItem && (
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-fg-subtle flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-warning"/> Favorite Item</span>
                        <span className="font-semibold text-white">{selectedGuest.favoriteItem}</span>
                      </div>
                    )}
                    {selectedGuest.favoriteCategory && (
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-fg-subtle flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning"/> Favorite Category</span>
                        <span className="font-semibold text-white">{selectedGuest.favoriteCategory}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service & Seating Notes */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Hospitality & Seating Notes</h4>
                <div className="space-y-2">
                  <textarea
                    value={noteEditVal}
                    onChange={(e) => setNoteEditVal(e.target.value)}
                    placeholder="Allergies (e.g. Peanut allergy), Seating preferences (e.g. Booth seat), Drink preferences..."
                    className="w-full min-h-[100px] p-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors resize-y leading-relaxed"
                  />
                  <Button
                    onClick={() => handleSaveNote(selectedGuest.id, noteEditVal)}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>

            </div>
          </SheetContent>
        )}
      </Sheet>

    </div>
  );
}
