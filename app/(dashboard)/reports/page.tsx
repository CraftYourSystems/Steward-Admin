"use client";

import { useState, useMemo } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { Printer, Mail, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeneratedReport } from "@/hooks/useReports";
import { formatCurrency } from "@/lib/utils";

type QuickRange = "7d" | "30d" | "90d";
const ISO = (d: Date) => d.toISOString();

function getRange(range: QuickRange) {
  const now = new Date();
  switch (range) {
    case "7d": return { from: ISO(startOfDay(subDays(now, 6))), to: ISO(endOfDay(now)) };
    case "30d": return { from: ISO(startOfDay(subDays(now, 29))), to: ISO(endOfDay(now)) };
    case "90d": return { from: ISO(startOfDay(subDays(now, 89))), to: ISO(endOfDay(now)) };
  }
}

export default function ReportsPage() {
  const [activeRange, setActiveRange] = useState<QuickRange>("7d");
  const [email, setEmail] = useState("");
  const [queryRange, setQueryRange] = useState<{ from: string; to: string } | null>(null);
  
  // Only fetch when queryRange is set
  const report = useGeneratedReport(queryRange || { from: "", to: "" }, !!queryRange);

  const handlePrint = () => {
    window.print();
  };

  const handleGenerate = () => {
    setQueryRange(getRange(activeRange));
  };

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-4 sm:space-y-5 max-w-[1400px] mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* ── Filters & Controls (Hidden when printing) ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 print:hidden">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Reports Hub</h2>
          <p className="text-[12px] text-fg-subtle mt-1">Generate and export printable weekly/monthly summaries.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {["7d", "30d", "90d"].map(r => (
              <button
                key={r}
                onClick={() => { setActiveRange(r as QuickRange); setQueryRange(null); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors",
                  activeRange === r ? "bg-primary text-primary-foreground" : "text-fg-muted hover:text-fg"
                )}
              >
                {r === "7d" ? "Weekly" : r === "30d" ? "Monthly" : "Quarterly"}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
              <input 
                type="email" 
                placeholder="Recipient email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-fg focus:outline-none focus:border-primary w-[200px]"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              className="h-9 px-4 flex items-center gap-2 bg-white text-black font-semibold rounded-lg text-sm hover:bg-white/90 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* ── Report Preview Area ──────────────────────────────────────────────── */}
      {!queryRange && (
        <div className="h-[400px] rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-fg-muted print:hidden">
          <FileText className="w-12 h-12 mb-4 opacity-50" />
          <p>Select a period and click Generate to view the report.</p>
        </div>
      )}

      {queryRange && report.isLoading && (
        <div className="h-[400px] rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center print:hidden">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-fg-subtle">Compiling report data...</p>
        </div>
      )}

      {queryRange && report.data && (
        <div className="relative">
          {/* Print controls overlay */}
          <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
            <button 
              onClick={handlePrint}
              className="h-8 px-3 flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:brightness-110 shadow-lg"
            >
              <Printer className="w-3.5 h-3.5" />
              Print to PDF
            </button>
          </div>

          {/* Printable Report Container */}
          <div className="bg-white text-black p-8 sm:p-12 rounded-xl shadow-xl min-h-[1056px] w-full max-w-[816px] mx-auto print:shadow-none print:p-0 print:max-w-full">
            
            {/* Report Header */}
            <div className="border-b-2 border-black/10 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2">Executive Summary</h1>
                <p className="text-sm font-medium text-black/60">
                  {new Date(report.data.period.from).toLocaleDateString()} — {new Date(report.data.period.to).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">Steward OS</div>
                <div className="text-xs text-black/50 uppercase tracking-widest mt-1">Auto-Generated Report</div>
              </div>
            </div>

            {/* Overview Section */}
            <div className="mb-10">
              <h2 className="text-lg font-bold uppercase tracking-wider text-black/80 border-b border-black/10 pb-2 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">1</span>
                Overview & Operations
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-black/5 p-4 rounded-lg">
                  <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-1">Total Orders</div>
                  <div className="text-2xl font-black">{report.data.overview.totalOrders}</div>
                </div>
                <div className="bg-black/5 p-4 rounded-lg">
                  <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-1">Items Sold</div>
                  <div className="text-2xl font-black">{report.data.overview.totalItems}</div>
                </div>
                <div className="bg-black/5 p-4 rounded-lg">
                  <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-1">Cancellations</div>
                  <div className="text-2xl font-black text-danger">{report.data.overview.cancelledOrders}</div>
                </div>
              </div>
            </div>

            {/* Finance Section */}
            <div className="mb-10">
              <h2 className="text-lg font-bold uppercase tracking-wider text-black/80 border-b border-black/10 pb-2 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-info/20 flex items-center justify-center text-info">2</span>
                Financial Estimates
              </h2>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border border-black/10 p-5 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-1">Total Revenue</div>
                    <div className="text-3xl font-black text-success">{formatCurrency(report.data.finance.revenue, "INR")}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-sm font-bold", report.data.finance.revenueGrowth >= 0 ? "text-success" : "text-danger")}>
                      {report.data.finance.revenueGrowth > 0 ? "+" : ""}{report.data.finance.revenueGrowth}%
                    </div>
                    <div className="text-[10px] text-black/40 uppercase">vs prev</div>
                  </div>
                </div>
                
                <div className="border border-black/10 p-5 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-1">Est. Profit</div>
                    <div className="text-3xl font-black">{formatCurrency(report.data.finance.profitEstimate, "INR")}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1 bg-black/5 p-4 rounded-lg flex justify-between items-center">
                  <div className="text-sm font-bold">Est. Food Cost %</div>
                  <div className="text-xl font-black">{report.data.finance.foodCostPct}%</div>
                </div>
                <div className="flex-1 bg-black/5 p-4 rounded-lg flex justify-between items-center">
                  <div className="text-sm font-bold">Labor Cost %</div>
                  {report.data.finance.laborCostPct !== null && report.data.finance.laborCostPct !== undefined ? (
                    <div className="text-2xl font-black">{report.data.finance.laborCostPct.toFixed(1)}%</div>
                  ) : (
                    <div className="text-xs font-semibold px-2 py-1 bg-warning/20 text-warning-800 rounded">
                      Requires V3 Config
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Marketing Section */}
            <div className="mb-10 page-break-inside-avoid">
              <h2 className="text-lg font-bold uppercase tracking-wider text-black/80 border-b border-black/10 pb-2 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-warning/20 flex items-center justify-center text-warning-800">3</span>
                Marketing & Acquisition
              </h2>
              
              <div className="border border-black/10 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/5 text-xs font-semibold uppercase text-black/60">
                    <tr>
                      <th className="px-4 py-3">Source Channel</th>
                      <th className="px-4 py-3 text-right">Orders</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {report.data.marketing.acquisitionMix.map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-bold">{m.source}</td>
                        <td className="px-4 py-3 text-right">{m.count}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.revenue, "INR")}</td>
                      </tr>
                    ))}
                    {report.data.marketing.acquisitionMix.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-black/50">No acquisition data found for this period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights Section */}
            <div className="page-break-inside-avoid">
              <h2 className="text-lg font-bold uppercase tracking-wider text-black/80 border-b border-black/10 pb-2 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-purple-700">4</span>
                Key Insights & Actions
              </h2>
              <div className="space-y-3">
                {report.data.insights.map((insight: any) => (
                  <div key={insight.id} className="flex gap-4 p-4 border border-black/10 rounded-lg">
                    <div className={cn(
                      "w-2 h-auto rounded-full shrink-0",
                      insight.type === "info" ? "bg-info" : insight.type === "warning" ? "bg-warning" : "bg-success"
                    )} />
                    <div>
                      <div className="font-bold text-base mb-1">{insight.title}</div>
                      <div className="text-sm text-black/70 leading-relaxed">{insight.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-black/10 text-center text-xs text-black/40 uppercase tracking-widest font-semibold">
              End of Report • Steward OS Platform
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
