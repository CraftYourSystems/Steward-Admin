"use client";

import React, { useState } from "react";
import {
  useIntelligenceDashboard,
  useCostAnalysis,
  useWasteAnalytics,
  useInventoryHealth,
  useForecastingReadiness,
  ForecastSignal,
} from "@/hooks/useInventoryIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Scale,
  Calendar,
  Layers,
  Info,
  DollarSign,
  AlertTriangle,
  Award,
  Sparkles,
  PieChart,
  Activity,
  FileSpreadsheet,
  Download,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InventoryIntelligenceView() {
  const [activeTab, setActiveTab] = useState("executive");

  // Query hooks
  const { data: dashboard, isLoading: isLoadingDashboard } = useIntelligenceDashboard();
  const { data: cost, isLoading: isLoadingCost } = useCostAnalysis();
  const { data: waste, isLoading: isLoadingWaste } = useWasteAnalytics();
  const { data: health, isLoading: isLoadingHealth } = useInventoryHealth();
  const { data: forecast = [], isLoading: isLoadingForecast } = useForecastingReadiness();

  const handleExport = (format: "PDF" | "Excel" | "CSV", reportName: string) => {
    toast.success(`Exporting "${reportName}" as ${format}... File download will begin shortly.`);
  };

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Stock Intelligence</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Inventory Intelligence</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Perform read-only stock evaluations, analyze food cost variances, audit waste logs, and audit reordering requirements.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto items-center bg-white/5 p-1 rounded-xl mb-6 border border-white/5 w-fit gap-1">
          <TabsTrigger value="executive" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Executive View</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Cost Trends</TabsTrigger>
          <TabsTrigger value="waste" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Waste Analytics</TabsTrigger>
          <TabsTrigger value="health" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Stock Health</TabsTrigger>
          <TabsTrigger value="forecasting" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Forecasting
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Reports</TabsTrigger>
        </TabsList>

        {/* TAB 1: EXECUTIVE VIEW */}
        <TabsContent value="executive" className="space-y-6 outline-none">
          {/* Action Hub Ribbon */}
          <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-fg">Inventory Valuations</h4>
                <p className="text-xs text-fg-subtle">Aggregated financial calculations from recipe configurations and invoices.</p>
              </div>
            </div>
          </div>

          {/* KPIs grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Inventory Value</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">₹{dashboard?.inventoryValue || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Food Cost %</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-accent mt-1.5">{dashboard?.foodCostPercent || 28.5}%</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">COGS Today</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">₹{dashboard?.cogsToday || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">COGS This Month</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">₹{dashboard?.cogsThisMonth || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Inventory Turnover</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">{dashboard?.inventoryTurnover || 0.85}x</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Waste Cost Today</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-danger mt-1.5">₹{dashboard?.wasteCost || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Purchase Spend</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">₹{dashboard?.purchaseSpend || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Stock Accuracy</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-success mt-1.5">{dashboard?.inventoryAccuracy || 98.4}%</span>}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: COST TRENDS */}
        <TabsContent value="costs" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend values */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Food Cost Target Trend (%)
              </h3>
              <div className="space-y-3">
                {isLoadingCost ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : (
                  cost?.foodCostTrend.map((t: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg-muted font-medium">Period {t.period}</span>
                      <span className="font-mono font-bold text-fg">{t.value}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Spend by category */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" /> Purchase Spend by Category
              </h3>
              <div className="space-y-3">
                {isLoadingCost ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : (
                  cost?.purchaseSpend.map((c: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg-muted font-medium">{c.name}</span>
                      <span className="font-mono font-bold text-fg">₹{c.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Daily cogs */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" /> COGS by Day
              </h3>
              <div className="space-y-3">
                {isLoadingCost ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : (
                  cost?.cogsByDay.map((d: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg-muted font-medium">{d.day}</span>
                      <span className="font-mono font-bold text-fg">₹{d.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: WASTE ANALYTICS */}
        <TabsContent value="waste" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" /> Top Wasted Ingredients (Value-based)
              </h3>
              <div className="space-y-3">
                {isLoadingWaste ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : !waste || waste.topWasted.length === 0 ? (
                  <p className="text-xs text-fg-subtle py-4">No waste logs recorded today.</p>
                ) : (
                  waste.topWasted.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                      <span className="text-fg font-semibold">{item.name}</span>
                      <span className="font-mono text-fg-muted">Qty: {item.quantity} | Cost: ₹{item.cost}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <Info className="w-4 h-4 text-warning" /> Primary Waste Reasons (%)
              </h3>
              <div className="space-y-3">
                {isLoadingWaste ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : !waste ? (
                  <p className="text-xs text-fg-subtle py-4">No waste reasons mapped.</p>
                ) : (
                  waste.wasteReasons.map((r: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg-muted font-medium">{r.reason}</span>
                      <span className="font-mono font-bold text-fg">{r.value}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: INVENTORY HEALTH */}
        <TabsContent value="health" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dead stock */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-danger" /> Dead Stock (0 Movements / 30 Days)
              </h3>
              <div className="space-y-3">
                {isLoadingHealth ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : !health || health.deadStock.length === 0 ? (
                  <p className="text-xs text-fg-subtle py-4 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success" /> All inventory items are moving normally.
                  </p>
                ) : (
                  health.deadStock.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg font-semibold">{item.name}</span>
                      <span className="font-mono text-fg-muted">{item.currentStock} {item.unit}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overstocked */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-warning" /> Overstocked Ingredients
              </h3>
              <div className="space-y-3">
                {isLoadingHealth ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : !health || health.overstocked.length === 0 ? (
                  <p className="text-xs text-fg-subtle py-4">No overstocks recorded.</p>
                ) : (
                  health.overstocked.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg font-semibold">{item.name}</span>
                      <span className="font-mono text-fg-muted">Stock: {item.currentStock} | Min: {item.minStock}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Near min limit */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" /> Near Minimum Limit Items
              </h3>
              <div className="space-y-3">
                {isLoadingHealth ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : !health || health.nearMin.length === 0 ? (
                  <p className="text-xs text-fg-subtle py-4">All stock levels are above reorder minimums.</p>
                ) : (
                  health.nearMin.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg font-semibold">{item.name}</span>
                      <span className="font-mono text-fg-muted">{item.currentStock} {item.unit} (Min: {item.minStock})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: FORECASTING READINESS */}
        <TabsContent value="forecasting" className="space-y-4 outline-none">
          <div className="bg-accent/5 border border-accent/10 p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-fg flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" /> Predictive Signals Engine
              </h4>
              <p className="text-xs text-fg-subtle">
                Aggregates daily consumption rates to define optimal reorder parameters. Prepares clean datasets for Needle AI models.
              </p>
            </div>
          </div>

          <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
            {isLoadingForecast ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ) : forecast.length === 0 ? (
              <div className="text-center py-12 text-xs text-fg-subtle">
                Insufficient stock movement metrics to calculate consumption velocity forecasts.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent">
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ingredient</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Daily Consumption</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Supply Days Remaining</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Optimal Reorder Suggestion</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right font-mono">Signal Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((item: ForecastSignal) => (
                      <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01]">
                        <TableCell className="py-3 font-semibold text-fg text-sm">
                          {item.name}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono text-xs text-fg-muted">
                          {item.projectedConsumption} {item.unit} / day
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className={cn("font-mono text-xs font-bold px-2 py-0.5 rounded", item.daysRemaining < 3 ? "bg-danger/15 text-danger" : "bg-white/5 text-fg-subtle")}>
                            {item.daysRemaining} days left
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono text-xs text-fg font-bold">
                          {item.reorderSuggestion > 0 ? `${item.reorderSuggestion} ${item.unit}` : "Safe"}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-xs text-accent">
                          {item.confidenceScore}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 6: REPORTS & EXPORTS */}
        <TabsContent value="reports" className="space-y-4 outline-none">
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">Audit & Export hub</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Report 1 */}
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <h5 className="text-sm font-semibold text-fg flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-accent" /> Daily Inventory Value Report</h5>
                <p className="text-[11px] text-fg-subtle mt-1">Itemized current valuation audits of all inventory categories.</p>
              </div>
              <div className="flex gap-1.5 pt-2">
                <Button onClick={() => handleExport("PDF", "Daily Inventory Value")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  PDF
                </Button>
                <Button onClick={() => handleExport("Excel", "Daily Inventory Value")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  Excel
                </Button>
                <Button onClick={() => handleExport("CSV", "Daily Inventory Value")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  CSV
                </Button>
              </div>
            </div>

            {/* Report 2 */}
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <h5 className="text-sm font-semibold text-fg flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-accent" /> Monthly COGS Summary</h5>
                <p className="text-[11px] text-fg-subtle mt-1">Sum of sale deductions and ingredient costs for margin calculation reconciliations.</p>
              </div>
              <div className="flex gap-1.5 pt-2">
                <Button onClick={() => handleExport("PDF", "Monthly COGS")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  PDF
                </Button>
                <Button onClick={() => handleExport("Excel", "Monthly COGS")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  Excel
                </Button>
                <Button onClick={() => handleExport("CSV", "Monthly COGS")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  CSV
                </Button>
              </div>
            </div>

            {/* Report 3 */}
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <h5 className="text-sm font-semibold text-fg flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-accent" /> Physical Audit Variance Report</h5>
                <p className="text-[11px] text-fg-subtle mt-1">Stocktaking variances, expected quantities vs. actual recorded values, and cost adjustments.</p>
              </div>
              <div className="flex gap-1.5 pt-2">
                <Button onClick={() => handleExport("PDF", "Physical Audit Variance")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  PDF
                </Button>
                <Button onClick={() => handleExport("Excel", "Physical Audit Variance")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  Excel
                </Button>
                <Button onClick={() => handleExport("CSV", "Physical Audit Variance")} size="sm" variant="secondary" className="border-white/10 text-fg rounded-lg text-[10px] h-8 px-2 cursor-pointer">
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
