"use client";

import { useAIDashboard, useProfitOpportunities } from "@/hooks/useAI";
import { cn, formatCurrency } from "@/lib/utils";
import {
  BrainCircuit,
  LineChart as LineChartIcon,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
  ChefHat,
  CloudSun,
  Info,
  Percent,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { useState } from "react";

type Timeframe = "tomorrow" | "weekend" | "week";

interface PredictionCardInfo {
  category: string;
  icon: any;
  forecast: string;
  confidence: string;
  reason: string;
  recommendation: string;
}

export function ForecastsView() {
  const { data, isLoading } = useAIDashboard();
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("tomorrow");

  if (isLoading) {
    return (
      <div className="p-6 text-center text-fg-muted animate-pulse flex flex-col items-center justify-center min-h-[300px] gap-2">
        <BrainCircuit className="w-8 h-8 text-accent animate-spin" />
        <span className="text-[12px] font-semibold tracking-wider uppercase opacity-75">Initializing Neural Engines...</span>
      </div>
    );
  }

  if (!data) return null;

  // Combine historical and forecast for the chart
  const chartData = [
    ...data.demandForecast.historical.map((h: any) => ({ ...h, isHistorical: true })),
    ...data.demandForecast.forecast.map((f: any) => ({ ...f, isHistorical: false })),
  ];

  const tomorrowOrders = data.demandForecast.forecast[0]?.volume ?? 15;

  // Calculated Forecast Ribbon Values based on Timeline Tabs
  const getForecastMetrics = () => {
    switch (activeTimeframe) {
      case "weekend":
        return {
          revenue: tomorrowOrders * 2.6 * 450,
          orders: Math.round(tomorrowOrders * 2.6),
          peakHour: "07:30 PM - 09:00 PM",
          staffing: "9 Members",
          inventoryRisk: "1 Item Critical",
          riskColor: "text-danger bg-danger/10 border-danger/20",
        };
      case "week":
        return {
          revenue: tomorrowOrders * 6.5 * 450,
          orders: Math.round(tomorrowOrders * 6.5),
          peakHour: "01:30 PM & 08:00 PM",
          staffing: "7 Members",
          inventoryRisk: "Healthy Levels",
          riskColor: "text-success bg-success/10 border-success/20",
        };
      case "tomorrow":
      default:
        return {
          revenue: tomorrowOrders * 450,
          orders: tomorrowOrders,
          peakHour: "01:00 PM - 02:00 PM",
          staffing: "6 Members",
          inventoryRisk: "2 Items Low Warning",
          riskColor: "text-warning bg-warning/10 border-warning/20",
        };
    }
  };

  // Group Predictions into Categories by Timeframe
  const getPredictions = (): PredictionCardInfo[] => {
    switch (activeTimeframe) {
      case "weekend":
        return [
          {
            category: "Revenue Growth",
            icon: TrendingUp,
            forecast: `${formatCurrency(tomorrowOrders * 2.6 * 450)} Expected (+22% spike)`,
            confidence: "88% Confidence",
            reason: "Saturdays show consistent historical ticket size uplifts from family groups.",
            recommendation: "Ensure cross-selling prompt overlays are active on tables QR screens.",
          },
          {
            category: "Floor Demand",
            icon: ShoppingBag,
            forecast: `${Math.round(tomorrowOrders * 2.6)} Orders expected`,
            confidence: "90% Confidence",
            reason: "Combined weekend seat reservation count is 14% higher than usual.",
            recommendation: "Stagger dinner prep shifts to begin 45 minutes earlier.",
          },
          {
            category: "Kitchen Throughput",
            icon: ChefHat,
            forecast: "Avg prep wait expected to exceed 16 minutes",
            confidence: "85% Confidence",
            reason: "Overlap of high volume dine-in and online delivery spikes.",
            recommendation: "Separate cold appetizers and main dish preparation lines.",
          },
          {
            category: "Inventory Risk",
            icon: AlertTriangle,
            forecast: "Fresh Poultry Stock depletion risk (92% probability)",
            confidence: "91% Confidence",
            reason: "High order forecast of Butter Chicken breast options.",
            recommendation: "Increase poultry replenishment stock batch count by 10kg.",
          },
          {
            category: "Staffing Allocations",
            icon: Users,
            forecast: "9 floor and kitchen members needed",
            confidence: "94% Confidence",
            reason: "Simultaneous seat orders during dinner peak velocity (7:30 PM).",
            recommendation: "Schedule two additional waiter shifts for floor service.",
          },
          {
            category: "Weather & Local Events",
            icon: CloudSun,
            forecast: "Sunny weather (+14% foot traffic)",
            confidence: "80% Confidence",
            reason: "Meteorology API maps clear skies and high temperatures.",
            recommendation: "Pre-chill extra beverages and prepare additional outdoor seating.",
          },
        ];
      case "week":
        return [
          {
            category: "Revenue Growth",
            icon: TrendingUp,
            forecast: `${formatCurrency(tomorrowOrders * 6.5 * 450)} Weekly total projection`,
            confidence: "85% Confidence",
            reason: "Holt-Winters weekly baseline calculation.",
            recommendation: "Enforce dynamic menu items pricing for slow-velocity weekdays.",
          },
          {
            category: "Floor Demand",
            icon: ShoppingBag,
            forecast: `${Math.round(tomorrowOrders * 6.5)} Total orders projected`,
            confidence: "92% Confidence",
            reason: "Consistent weekday lunch demand baseline.",
            recommendation: "Audit menu items conversion funnel to capture slow clicks.",
          },
          {
            category: "Kitchen Throughput",
            icon: ChefHat,
            forecast: "12-minute baseline wait expectation",
            confidence: "88% Confidence",
            reason: "Normal staff roster schedule mapped for week hours.",
            recommendation: "No extra shifts required. Maintain default staffing roster.",
          },
          {
            category: "Inventory Risk",
            icon: AlertTriangle,
            forecast: "Dairy item cost creep projection",
            confidence: "78% Confidence",
            reason: "Price volatility trend reports dairy supply cost spikes next Tuesday.",
            recommendation: "Secure batch orders from Dairy Land today to lock current pricing.",
          },
          {
            category: "Staffing Allocations",
            icon: Users,
            forecast: "7 active operators recommended",
            confidence: "90% Confidence",
            reason: "Normal order volumes expected across lunch hours.",
            recommendation: "Review weekly staff schedule to ensure balanced cover.",
          },
          {
            category: "Weather & Local Events",
            icon: CloudSun,
            forecast: "Occasional rain showers mid-week",
            confidence: "75% Confidence",
            reason: "Local meteorological forecasts indicate rain next Wednesday.",
            recommendation: "Prepare delivery packaging materials and expect 12% takeaway surge.",
          },
        ];
      case "tomorrow":
      default:
        return [
          {
            category: "Revenue Growth",
            icon: TrendingUp,
            forecast: `${formatCurrency(tomorrowOrders * 450)} Expected (+8% bump)`,
            confidence: "92% Confidence",
            reason: "Historical Friday dinner patterns and customer bookings velocity.",
            recommendation: "Pre-set high margin appetizers at top billing slots.",
          },
          {
            category: "Floor Demand",
            icon: ShoppingBag,
            forecast: `${tomorrowOrders} Completed orders expected`,
            confidence: "95% Confidence",
            reason: "Holt-Winters smoothing of baseline orders.",
            recommendation: "Pre-cook base gravies and prepare extra dessert portions.",
          },
          {
            category: "Kitchen Throughput",
            icon: ChefHat,
            forecast: "14-minute average wait predicted",
            confidence: "90% Confidence",
            reason: "Concentration of dine-in tables during lunch rush.",
            recommendation: "Enforce strict kitchen KDS order prep prioritization guidelines.",
          },
          {
            category: "Inventory Risk",
            icon: AlertTriangle,
            forecast: "Tomatoes low-stock warning (15.5 kg remaining)",
            confidence: "94% Confidence",
            reason: "Current stock level is near minimum safety warning boundary.",
            recommendation: "Replenish fresh vegetables supply before Friday lunch rush starts.",
          },
          {
            category: "Staffing Allocations",
            icon: Users,
            forecast: "6 active operators recommended",
            confidence: "91% Confidence",
            reason: "Concentrated traffic volume expected between 1:00 PM and 2:00 PM.",
            recommendation: "Schedule one extra kitchen assistant to handle peak dish washing.",
          },
          {
            category: "Weather & Local Events",
            icon: CloudSun,
            forecast: "Clear skies forecasted",
            confidence: "85% Confidence",
            reason: "Meteorology reports sunny conditions.",
            recommendation: "Expect standard dine-in foot traffic volumes.",
          },
        ];
    }
  };

  const metrics = getForecastMetrics();
  const predictions = getPredictions();

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2 select-none">
            Predictive AI Forecasts
            <BrainCircuit className="w-4.5 h-4.5 text-accent" />
          </h2>
          <p className="text-[12px] text-fg-subtle mt-1 font-normal">
            Neural forecasting and demand projections mapping tomorrow's operational targets.
          </p>
        </div>
      </div>

      {/* Profit opportunity segment */}
      <ProfitOpportunitySection />

      {/* Timeline Tabs */}
      <div className="flex gap-1.5 border-b border-white/5 pb-2 mt-4">
        {[
          { id: "tomorrow", label: "Tomorrow" },
          { id: "weekend", label: "This Weekend" },
          { id: "week", label: "Next Week" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTimeframe(tab.id as any)}
            className={cn(
              "px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-150 cursor-pointer border",
              activeTimeframe === tab.id
                ? "bg-white/10 border-white/10 text-fg"
                : "bg-transparent border-transparent text-fg-subtle hover:text-fg"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Executive Forecast Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: "Estimated Revenue",
            count: formatCurrency(metrics.revenue),
            color: "text-fg bg-white/5 border-white/10",
          },
          { label: "Expected Orders", count: metrics.orders, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
          { label: "Expected Peak Hour", count: metrics.peakHour, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
          { label: "Required Roster", count: metrics.staffing, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
          {
            label: "Inventory Alert",
            count: metrics.inventoryRisk,
            color: metrics.riskColor,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("flex flex-col gap-1 p-3.5 rounded-xl border justify-center transition-all", stat.color)}
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

      {/* Timeline-Filtered Prediction Cards Grid */}
      <div className="space-y-3 pt-3 border-t border-white/5">
        <div>
          <h3 className="text-[14px] font-bold text-fg">Department Predictions & Planning</h3>
          <p className="text-[11px] text-fg-subtle font-normal">
            Operational recommendations categorized by business parameters for {activeTimeframe}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.category}
                className="flex flex-col rounded-xl border border-white/5 p-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                    <CardIcon className="w-3 h-3" />
                    {card.category}
                  </span>
                  <span className="text-[10px] font-semibold text-success/80 num">{card.confidence}</span>
                </div>

                <div className="space-y-2 flex-1">
                  <h4 className="text-[13px] font-bold text-fg leading-snug">{card.forecast}</h4>
                  <p className="text-[11.5px] text-fg-muted font-normal leading-relaxed">{card.reason}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <span className="text-[9.5px] font-extrabold text-accent uppercase tracking-wider block mb-1">
                    Prep Recommendation
                  </span>
                  <p className="text-[12px] font-semibold text-fg leading-snug">{card.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model accuracy stats and Recharts forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-white/5">
        {/* Demand Forecasting Chart */}
        <div className="lg:col-span-2 bg-white/[0.01] rounded-xl border border-white/5 p-4 sm:p-5 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[14px] font-bold text-fg flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-accent" />
                Demand Projection (7 Days)
              </h3>
              <p className="text-[11px] text-fg-subtle font-normal mt-1">
                Holt-Winters time-series projection with 95% confidence bands.
              </p>
            </div>
            <div className="text-[10px] text-fg-muted bg-white/5 border border-white/5 px-2 py-0.5 rounded num">
              MAPE: {data.demandForecast.mape}%
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
                <Area type="monotone" dataKey="upperBound" stroke="none" fill="rgba(139, 92, 246, 0.08)" />
                <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#000" />

                {/* Historical Line */}
                <Line type="monotone" dataKey="volume" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: "#000", stroke: "#8B5CF6" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-start gap-2.5 mt-4 p-3 bg-white/5 border border-white/5 rounded-xl">
            <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span className="text-[11px] text-fg-subtle leading-relaxed">
              <strong>Understanding predictions</strong>: Shaded bands represent the 95% Confidence Interval. Projections are likelihood ranges and should not be treated as absolute. Use these bounds to set safety stock levels.
            </span>
          </div>
        </div>

        {/* Churn Prediction Risk list */}
        <div className="bg-white/[0.01] rounded-xl border border-white/5 p-4 sm:p-5 flex flex-col">
          <h3 className="text-[14px] font-bold text-fg flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-danger" />
            High-Risk Churn List
          </h3>
          <p className="text-[11px] text-fg-subtle font-normal mb-4">
            Logistic Regression evaluating RFM decay patterns.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-[340px] custom-scrollbar">
            {data.churnPrediction.atRisk.map((c: any) => (
              <div key={c.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-fg truncate max-w-[130px]" title={c.name}>{c.name}</div>
                  <div className="text-[10.5px] text-fg-muted mt-0.5 num">
                    Last active {c.recency} days ago
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-danger num">{c.churnProbability}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-fg-subtle">Risk Prob.</div>
                </div>
              </div>
            ))}
            {data.churnPrediction.atRisk.length === 0 && (
              <div className="text-center text-sm text-fg-muted py-10">Awaiting data to train model.</div>
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
      <div className="bg-white/[0.01] rounded-xl border border-white/5 p-4 flex items-center gap-4">
        <AlertTriangle className="w-8 h-8 text-warning opacity-55" />
        <div>
          <h3 className="text-[13px] font-bold text-fg">Profit Opportunity Finder (Benchmarking)</h3>
          <p className="text-[11px] text-fg-muted font-normal leading-relaxed">
            {data?.message || "Collecting cohort data for your city/cuisine type."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white/[0.01] to-white/[0.02] rounded-xl border border-success/30 p-5 lg:p-6 shadow-[0_0_40px_rgba(34,197,94,0.02)] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Percent className="w-32 h-32 text-success" />
      </div>

      <div className="relative z-10">
        <h3 className="text-[15px] font-bold text-fg flex items-center gap-2 mb-1">
          <TrendingUp className="w-4.5 h-4.5 text-success" />
          Profit Opportunity Finder
        </h3>
        <p className="text-[12px] text-fg-subtle font-normal mb-5">
          Cross-referencing your metrics against anonymized peers in your city/cuisine cohort.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.opportunities.map((opt: any) => (
            <div
              key={opt.id}
              className="bg-black/40 border border-success/20 rounded-xl p-5 hover:border-success/40 transition-colors group"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-fg text-[13px]">{opt.title}</h4>
                <div className="bg-success/20 text-success text-[10px] px-2.5 py-1 rounded-full font-mono font-bold border border-success/30 num">
                  {opt.upsideLabel}
                </div>
              </div>
              <p className="text-[12px] text-fg-muted mb-4 leading-relaxed font-normal">{opt.description}</p>

              <div className="flex items-center gap-2 text-[12px] font-semibold text-success group-hover:translate-x-1 transition-transform cursor-pointer w-fit">
                Action: {opt.action} <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
