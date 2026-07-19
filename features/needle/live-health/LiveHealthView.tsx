"use client";

import { useLiveOpsSummary } from "@/hooks/useLiveOps";
import { useOperationalPhase } from "@/hooks/useOperationalPhase";
import { resolveNeedleExperience } from "@/lib/needle";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Activity,
  Clock,
  Users,
  Flame,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Heart,
  UtensilsCrossed,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  Pause,
} from "lucide-react";
import { useState, useEffect } from "react";

// ─── Status Card (Information Priority Pattern) ──────────────────────────────
interface StatusCardProps {
  title: string;
  status: string;
  reason: string;
  supporting: string;
  icon: React.ElementType;
  variant: "optimal" | "warning" | "critical" | "info";
}

function StatusCard({ title, status, reason, supporting, icon: Icon, variant }: StatusCardProps) {
  const themes = {
    optimal: "border-success/30 bg-success/5 text-success shadow-[0_0_20px_rgba(34,197,94,0.02)]",
    warning: "border-warning/30 bg-warning/5 text-warning shadow-[0_0_20px_rgba(234,179,8,0.02)]",
    critical: "border-danger/30 bg-danger/5 text-danger shadow-[0_0_20px_rgba(239,68,68,0.02)]",
    info: "border-info/30 bg-info/5 text-info shadow-[0_0_20px_rgba(59,130,246,0.02)]",
  };

  const textColors = {
    optimal: "text-success",
    warning: "text-warning",
    critical: "text-danger",
    info: "text-info",
  };

  return (
    <div className={cn("rounded-2xl border p-4.5 flex flex-col justify-between transition-all", themes[variant])}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{title}</span>
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <div className={cn("text-lg font-black tracking-tight", textColors[variant])}>
          {status}
        </div>
        <p className="text-[12px] font-medium text-fg-muted mt-1 leading-relaxed">
          {reason}
        </p>
      </div>
      <div className="text-[10px] text-fg-subtle mt-3 border-t border-white/5 pt-2 select-all">
        {supporting}
      </div>
    </div>
  );
}

// ─── Supporting KPI Card ────────────────────────────────────────────────────
function KPICard({ title, value, subtext, icon: Icon, colorClass }: any) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
      <div className="min-w-0">
        <span className="text-[10.5px] font-bold text-fg-subtle uppercase tracking-wider block mb-0.5">{title}</span>
        <span className="text-xl font-bold text-fg num">{value}</span>
        {subtext && <p className="text-[10px] text-fg-subtle mt-0.5 truncate">{subtext}</p>}
      </div>
      <div className={cn("grid place-items-center h-8.5 w-8.5 rounded-lg shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

// ─── SLA Order Flow Column ──────────────────────────────────────────────────
function SlaColumn({ title, orders, colorClass, emptyText }: any) {
  return (
    <div className="flex flex-col h-full bg-white/[0.01] border border-white/5 rounded-xl p-3">
      <div className="flex justify-between items-center mb-3 px-1.5">
        <h4 className={cn("text-[11.5px] font-bold uppercase tracking-wider", colorClass)}>{title}</h4>
        <span className="text-[11px] font-bold bg-white/5 px-2 py-0.5 rounded-full text-fg-muted">{orders.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1 custom-scrollbar">
        {orders.length === 0 ? (
          <div className="text-center text-xs text-fg-subtle py-8 italic select-none">{emptyText}</div>
        ) : (
          orders.map((o: any) => (
            <div key={o.id} className="bg-[#131315] p-3 rounded-lg border border-white/5 text-[12.5px] transition-all hover:border-white/10">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-fg">Order #{o.orderNumber}</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-white/5 text-fg-subtle rounded tracking-wide">{o.type}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-fg-subtle">
                <span className="capitalize">{o.status.toLowerCase()}</span>
                <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3 text-accent"/>{o.elapsedMins}m / {o.slaMins}m</span>
              </div>
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", colorClass.replace("text-", "bg-"))}
                  style={{ width: `${Math.min(100, (o.elapsedMins / o.slaMins) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Non-Service Reassurance Banner ─────────────────────────────────────────

function ReassuranceBanner({ phase }: { phase: string }) {
  const messages: Record<string, string> = {
    opening: "Service has not started yet. Live monitoring will activate when the first order arrives.",
    quiet: "No active orders. Monitoring will resume when service resumes.",
    closing: "Today's service has concluded. Monitoring is paused until tomorrow.",
  };
  const message = messages[phase] || messages.quiet;

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col items-center gap-3 text-center">
      <div className="p-3 rounded-full bg-white/5">
        <Pause className="w-5 h-5 text-fg-subtle" />
      </div>
      <p className="text-[13px] font-semibold text-fg">{message}</p>
      <p className="text-[11px] text-fg-subtle max-w-md">
        Needle continuously monitors operational signals. When activity resumes, this view will update automatically.
      </p>
    </div>
  );
}

// ─── Main View ──────────────────────────────────────────────────────────────
export function LiveHealthView() {
  const { data, isLoading, isFetching } = useLiveOpsSummary();
  const { phase, isServiceActive } = useOperationalPhase();
  const experience = resolveNeedleExperience(phase);

  // Manual expand state for non-service phases
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-fg-subtle animate-pulse flex flex-col items-center justify-center gap-3">
        <Activity className="h-6 w-6 text-accent animate-pulse" />
        <span className="text-[12px] font-semibold uppercase tracking-wider">Acquiring live telemetry...</span>
      </div>
    );
  }

  if (!data) return null;

  const { onTime = [], atRisk = [], delayed = [] } = data.slaBuckets || {};
  const activeCount = data.queue?.activeCount ?? 0;
  const avgWait = data.queue?.avgWaitMins ?? 0;

  // ── Context-Sensitive Auto-Expansion ────────────────────────────────────
  // If there are active alerts, SLA breaches, or delayed orders even outside
  // active service, automatically expand the dashboard
  const hasActiveAlerts = (data.alerts?.length ?? 0) > 0;
  const hasDelayed = delayed.length > 0;
  const shouldAutoExpand = hasActiveAlerts || hasDelayed || activeCount > 0;
  const showFullDashboard = isServiceActive || manuallyExpanded || shouldAutoExpand;

  // ── Vital Signs Derivations ───────────────────────────────────────────────

  // 1. Overall Restaurant Health
  let overallStatus: "optimal" | "warning" | "critical" = "optimal";
  let overallReason = "All core systems operating normally.";
  if (delayed.length > 0) {
    overallStatus = "critical";
    overallReason = `${delayed.length} order${delayed.length !== 1 ? "s" : ""} exceeding SLA parameters.`;
  } else if (atRisk.length > 0 || avgWait > 20) {
    overallStatus = "warning";
    overallReason = `${atRisk.length} active order${atRisk.length !== 1 ? "s" : ""} near SLA threshold.`;
  }

  // 2. Kitchen Health
  let kitchenStatus: "optimal" | "warning" | "critical" = "optimal";
  let kitchenReason = "Station throughput is normal.";
  if (delayed.length > 1) {
    kitchenStatus = "critical";
    kitchenReason = "Multiple bottlenecked stations.";
  } else if (activeCount > 8 || atRisk.length > 0) {
    kitchenStatus = "warning";
    kitchenReason = "Station queues under stress.";
  }

  // 3. Service Health
  let serviceStatus: "optimal" | "warning" | "critical" = "optimal";
  let serviceReason = "Dine-in and pickup delay limits clean.";
  if (avgWait > 25) {
    serviceStatus = "critical";
    serviceReason = "Customer ticket time severely high.";
  } else if (avgWait > 15) {
    serviceStatus = "warning";
    serviceReason = "Wait times creeping above standard limit.";
  }

  // 4. Staffing Status
  let staffingStatus: "optimal" | "warning" | "critical" = "optimal";
  let staffingReason = "Roster capacity meets demand.";
  if (data.staff.online < data.staff.scheduled) {
    staffingStatus = activeCount > 5 ? "warning" : "info" as any;
    staffingReason = "Fewer staff than scheduled clocked in.";
  }

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-6 max-w-[1400px] mx-auto text-fg">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1.5 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-fg flex items-center gap-2 select-none">
            {experience.title}
            {isServiceActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[9px] font-bold text-success animate-pulse shrink-0 tracking-wider uppercase">
                <Activity className="h-3 w-3" /> Live
              </span>
            )}
          </h2>
          <p className="text-[12px] text-fg-subtle mt-0.5">{experience.greeting}</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && <RefreshCw className="w-3.5 h-3.5 text-fg-muted animate-spin" />}
        </div>
      </div>

      {/* ── Non-Service Reassurance ── */}
      {!showFullDashboard && (
        <div className="space-y-3">
          <ReassuranceBanner phase={phase} />
          <button
            onClick={() => setManuallyExpanded(true)}
            className="flex items-center gap-2 mx-auto text-[11px] font-semibold text-fg-muted hover:text-fg transition-colors cursor-pointer py-2"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            View full operational status
          </button>
        </div>
      )}

      {/* ── Full Dashboard (expanded during service or on demand) ── */}
      {showFullDashboard && (
        <>
          {/* Section 1: Operational Status */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-fg-subtle select-none">Operational Status</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <StatusCard
                title="Overall Health"
                status={overallStatus.toUpperCase()}
                reason={overallReason}
                supporting={`${activeCount} active orders in queue`}
                icon={Heart}
                variant={overallStatus}
              />
              <StatusCard
                title="Kitchen Health"
                status={kitchenStatus.toUpperCase()}
                reason={kitchenReason}
                supporting="Station load monitoring active"
                icon={UtensilsCrossed}
                variant={kitchenStatus}
              />
              <StatusCard
                title="Service Health"
                status={serviceStatus.toUpperCase()}
                reason={serviceReason}
                supporting={`Average prep time is ${avgWait} mins`}
                icon={Clock}
                variant={serviceStatus}
              />
              <StatusCard
                title="Staffing Status"
                status={data.staff.online >= data.staff.scheduled ? "OPTIMAL" : "UNDERSTAFFED"}
                reason={staffingReason}
                supporting={`${data.staff.online} of ${data.staff.scheduled} staff online`}
                icon={Users}
                variant={data.staff.online >= data.staff.scheduled ? "optimal" : "warning"}
              />
            </div>
          </div>

          {/* Section 2: Needs Attention */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-fg-subtle select-none">Attention</h3>
            {data.alerts.length === 0 ? (
              <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
                <CheckCircle className="h-4.5 w-4.5 text-success shrink-0" />
                <span className="text-[12.5px] font-semibold text-success">✓ Everything is running smoothly</span>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {data.alerts.map((a: any) => (
                  <div
                    key={a.id}
                    className={cn(
                      "p-3 rounded-xl border text-[12.5px] flex gap-2.5 items-center font-medium",
                      a.severity === "critical"
                        ? "bg-danger/10 border-danger/20 text-danger"
                        : a.severity === "warning"
                        ? "bg-warning/10 border-warning/20 text-warning"
                        : "bg-info/10 border-info/20 text-info"
                    )}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{a.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Operations KPIs */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-fg-subtle select-none">Operations</h3>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Active Orders"
                value={`${activeCount}`}
                subtext="Tickets currently active"
                icon={Activity}
                colorClass="bg-accent/10 text-accent"
              />
              <KPICard
                title="Avg Ticket Time"
                value={`${avgWait} min`}
                subtext="Average preparation cycle"
                icon={Clock}
                colorClass="bg-warning/10 text-warning"
              />
              <KPICard
                title="Dine-in Occupancy"
                value={`${data.occupancy} Tables`}
                subtext="Dine-in tables in service"
                icon={Users}
                colorClass="bg-info/10 text-info"
              />
              <KPICard
                title="Staffing Ratio"
                value={`${data.staff.online} / ${data.staff.scheduled}`}
                subtext="Clocked In / Scheduled"
                icon={CheckCircle}
                colorClass="bg-success/10 text-success"
              />
            </div>
          </div>

          {/* Section 4 & 5: Kitchen + Order Flow */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Kitchen */}
            <div className="lg:col-span-1 bg-white/[0.01] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[13.5px] font-bold text-fg flex items-center gap-2">
                    <Flame className="w-4.5 h-4.5 text-accent" />
                    Kitchen Station Load
                  </h3>
                  <p className="text-[11px] text-fg-subtle font-normal mt-0.5">Real-time load and station bottlenecks.</p>
                </div>

                <div className="space-y-3.5">
                  {Object.keys(data.stationLoad).length === 0 ? (
                    <div className="text-xs text-fg-subtle italic text-center py-6">Kitchen stations currently idle</div>
                  ) : (
                    Object.entries(data.stationLoad).map(([cat, qty]: any) => (
                      <div key={cat}>
                        <div className="flex justify-between text-[12px] mb-1.5">
                          <span className="font-semibold">{cat} Station</span>
                          <span className="font-bold text-fg-muted">{qty} items</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", qty > 6 ? "bg-danger" : qty > 3 ? "bg-warning" : "bg-accent")}
                            style={{ width: `${Math.min(100, (qty / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Sellers */}
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-[11.5px] font-bold text-fg-muted uppercase tracking-wider flex items-center gap-1.5 mb-3 select-none">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  Top Items Today
                </h4>
                <div className="space-y-2">
                  {data.topSellers && data.topSellers.length > 0 ? (
                    data.topSellers.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[12px] bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5">
                        <span className="font-medium text-fg-muted">{item.name}</span>
                        <span className="font-bold num text-fg">{item.quantity} sold</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-fg-subtle italic py-2">No completed orders today.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Flow (Kanban by SLA) */}
            <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col space-y-4">
              <div>
                <h3 className="text-[13.5px] font-bold text-fg">Active Order Flow</h3>
                <p className="text-[11px] text-fg-subtle font-normal mt-0.5">Track live prep velocity against target SLA limits.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                <SlaColumn title="On-Time" orders={onTime} colorClass="text-success" emptyText="No on-time orders" />
                <SlaColumn title="At-Risk (>75%)" orders={atRisk} colorClass="text-warning" emptyText="No at-risk orders" />
                <SlaColumn title="Delayed (>100%)" orders={delayed} colorClass="text-danger" emptyText="No delayed orders" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
