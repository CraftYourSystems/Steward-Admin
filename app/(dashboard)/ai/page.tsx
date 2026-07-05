"use client";

import { useAIDashboard, useProfitOpportunities } from "@/hooks/useAI";
import { cn } from "@/lib/utils";
import { BrainCircuit, LineChart as LineChartIcon, Users, TrendingUp, AlertTriangle, ArrowRight, Activity, Percent } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts";

export default function AIPredictivePage() {
  const { data, isLoading } = useAIDashboard();

  if (isLoading) return <div className="p-6 text-center text-fg-muted animate-pulse">Initializing Neural Engines...</div>;
  if (!data) return null;

  // Combine historical and forecast for the chart
  const chartData = [
    ...data.demandForecast.historical.map((h: any) => ({ ...h, isHistorical: true })),
    ...data.demandForecast.forecast.map((f: any) => ({ ...f, isHistorical: false }))
  ];

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
            Predictive AI <span className="bg-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full border border-accent/30 font-bold uppercase">V3 Active</span>
          </h2>
          <p className="text-[13px] text-fg-subtle mt-1">Cross-tenant benchmarking and profit finder.</p>
        </div>
      </div>

      <ProfitOpportunitySection />

      {/* Top row: Rush Hour & Accuracy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rush Hour Prediction */}
        <div className="md:col-span-2 bg-gradient-to-r from-accent/20 to-surface border border-accent/30 rounded-[20px] p-5 flex items-center gap-5">
          <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-accent uppercase tracking-wider mb-1">Rush Hour Prediction: {data.rushHour.status}</h3>
            <p className="text-sm text-fg-muted">{data.rushHour.message}</p>
          </div>
        </div>

        {/* Global Model Accuracy */}
        <div className="bg-surface rounded-[20px] border border-white/10 p-5 flex flex-col justify-center">
          <h3 className="text-[11px] font-bold text-fg-subtle uppercase tracking-wider mb-2">Model Accuracy (MAPE)</h3>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold text-success">{data.demandForecast.mape}%</div>
              <div className="text-[10px] text-fg-muted mt-1">{data.demandForecast.model}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-info">{data.churnPrediction.accuracy}%</div>
              <div className="text-[10px] text-fg-muted mt-1">Classification Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Demand Forecasting */}
        <div className="bg-surface rounded-[20px] border border-white/10 p-5 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-accent" />
                Demand Forecast (7 Days)
              </h3>
              <p className="text-xs text-fg-subtle mt-1">Holt-Winters time-series projection with 95% confidence bands.</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} tickFormatter={(val) => val.substring(5)} />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#888" }}
                />
                {/* Confidence band for forecast */}
                <Area type="monotone" dataKey="upperBound" stroke="none" fill="rgba(217, 184, 114, 0.1)" />
                <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#000" />
                
                {/* Historical Line */}
                <Line type="monotone" dataKey="volume" stroke="#fff" strokeWidth={2} dot={{ r: 3, fill: "#000", stroke: "#fff" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Prediction */}
        <div className="bg-surface rounded-[20px] border border-white/10 p-5 flex flex-col">
          <h3 className="text-base font-semibold text-fg flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-danger" />
            High-Risk Churn List
          </h3>
          <p className="text-xs text-fg-subtle mb-4">Logistic Regression evaluating RFM decay patterns.</p>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {data.churnPrediction.atRisk.map((c: any) => (
              <div key={c.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-fg">{c.id}</div>
                  <div className="text-[11px] text-fg-muted mt-0.5">Last order {c.recency} days ago • {c.frequency} total orders</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-danger">{c.churnProbability}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-fg-subtle">Churn Risk</div>
                </div>
              </div>
            ))}
            {data.churnPrediction.atRisk.length === 0 && (
               <div className="text-center text-sm text-fg-muted py-10">Awaiting data to train classification model.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function ProfitOpportunitySection() {
  const { data, isLoading } = useProfitOpportunities();

  if (isLoading) return null;
  if (!data || data.status !== "SUCCESS") {
    return (
      <div className="bg-surface rounded-[20px] border border-white/10 p-5 flex items-center gap-4">
         <AlertTriangle className="w-8 h-8 text-warning opacity-50" />
         <div>
           <h3 className="text-sm font-bold text-fg">Profit Opportunity Finder (Moonshot)</h3>
           <p className="text-xs text-fg-muted">{data?.message || "Collecting cohort data for your city/cuisine type."}</p>
         </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-surface to-surface-2 rounded-[20px] border border-success/30 p-5 lg:p-6 shadow-[0_0_40px_rgba(34,197,94,0.05)] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Percent className="w-32 h-32 text-success" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-fg flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-success" />
          Profit Opportunity Finder
        </h3>
        <p className="text-sm text-fg-subtle mb-6">Cross-referencing your metrics against anonymized peers in your city/cuisine cohort.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.opportunities.map((opt: any) => (
            <div key={opt.id} className="bg-black/40 border border-success/20 rounded-xl p-5 hover:border-success/40 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-fg text-sm">{opt.title}</h4>
                <div className="bg-success/20 text-success text-[11px] px-2.5 py-1 rounded-full font-mono font-bold border border-success/30">
                  {opt.upsideLabel}
                </div>
              </div>
              <p className="text-xs text-fg-muted mb-4 leading-relaxed">{opt.description}</p>
              
              <div className="flex items-center gap-2 text-xs font-semibold text-success group-hover:translate-x-1 transition-transform cursor-pointer w-fit">
                Action: {opt.action} <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}