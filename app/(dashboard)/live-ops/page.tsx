"use client";

import { useLiveOpsSummary } from "@/hooks/useLiveOps";
import { formatCurrency, cn } from "@/lib/utils";
import { Activity, Clock, Users, Flame, AlertTriangle, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

function KPICard({ title, value, subtext, icon: Icon, color }: any) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("grid place-items-center h-8 w-8 rounded-lg", color.bg)}>
          <Icon className={cn("h-4 w-4", color.text)} />
        </div>
        <h3 className="text-[13px] font-semibold text-fg-muted uppercase tracking-wider">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-fg">{value}</div>
      {subtext && <div className="text-[11px] text-fg-subtle mt-1">{subtext}</div>}
    </div>
  );
}

function SlaColumn({ title, orders, colorClass, emptyText }: any) {
  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="flex justify-between items-center mb-3 px-2">
        <h4 className={cn("text-xs font-bold uppercase tracking-wider", colorClass)}>{title}</h4>
        <span className="text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-full">{orders.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {orders.length === 0 ? (
          <div className="text-center text-xs text-fg-subtle py-8 italic">{emptyText}</div>
        ) : (
          orders.map((o: any) => (
            <div key={o.id} className="bg-surface-2 p-3 rounded-lg border border-white/5 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">#{o.orderNumber}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/20 rounded">{o.type}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-fg-muted mt-2">
                <span>{o.status}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {o.elapsedMins}m / {o.slaMins}m</span>
              </div>
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
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

export default function LiveOpsPage() {
  const { data, isLoading, isFetching } = useLiveOpsSummary();

  if (isLoading) {
    return <div className="p-6 text-center text-fg-muted animate-pulse">Loading Live Ops Command Center...</div>;
  }

  if (!data) return null;

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2">
            Live Ops Command Center
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success animate-pulse shrink-0">
              <Activity className="h-3 w-3" /> Live Polling (10s)
            </span>
          </h2>
          <p className="text-[12px] text-fg-subtle mt-1">Real-time pulse of your restaurant operations.</p>
        </div>
        {isFetching && <RefreshCw className="w-4 h-4 text-fg-muted animate-spin" />}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mt-4">
        <KPICard title="Live Revenue" value={formatCurrency(data.revenue.live)} subtext={`${data.revenue.growth > 0 ? "+" : ""}${data.revenue.growth}% vs last week same time`} icon={Activity} color={{ bg: "bg-success/10", text: "text-success" }} />
        <KPICard title="Occupancy" value={`${data.occupancy} Tables`} subtext="Active Dine-In" icon={Users} color={{ bg: "bg-info/10", text: "text-info" }} />
        <KPICard title="Avg Wait Time" value={`${data.queue.avgWaitMins} mins`} subtext={`${data.queue.activeCount} orders in queue`} icon={Clock} color={{ bg: "bg-warning/10", text: "text-warning" }} />
        <KPICard title="Staff Online" value={`${data.staff.online} / ${data.staff.scheduled}`} subtext="Clocked In" icon={CheckCircle} color={{ bg: "bg-accent/10", text: "text-accent" }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-4 h-[500px]">
        {/* Kanban SLA Board */}
        <div className="col-span-1 lg:col-span-2 bg-surface rounded-[20px] border border-white/10 p-4 flex flex-col">
          <h3 className="text-[13px] font-semibold text-fg mb-4">Active Orders by SLA</h3>
          <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
            <SlaColumn title="On-Time" orders={data.slaBuckets.onTime} colorClass="text-success" emptyText="No on-time orders" />
            <SlaColumn title="At-Risk (>75%)" orders={data.slaBuckets.atRisk} colorClass="text-warning" emptyText="No at-risk orders" />
            <SlaColumn title="Delayed (>100%)" orders={data.slaBuckets.delayed} colorClass="text-danger" emptyText="No delayed orders" />
          </div>
        </div>

        {/* Side widgets */}
        <div className="flex flex-col gap-4 min-h-0">
          
          {/* Alerts Feed */}
          <div className="bg-surface rounded-[20px] border border-white/10 p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-[13px] font-semibold text-fg mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Live Alerts Feed
            </h3>
            <div className="space-y-2 overflow-y-auto flex-1">
              {data.alerts.length === 0 ? (
                <div className="text-xs text-fg-subtle italic text-center mt-4">No active alerts</div>
              ) : (
                data.alerts.map((a: any) => (
                  <div key={a.id} className={cn("p-2.5 rounded-lg border text-xs flex gap-2 items-start", a.severity === "critical" ? "bg-danger/10 border-danger/20 text-danger" : a.severity === "warning" ? "bg-warning/10 border-warning/20 text-warning" : "bg-info/10 border-info/20 text-info")}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{a.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Station Load */}
          <div className="bg-surface rounded-[20px] border border-white/10 p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-[13px] font-semibold text-fg mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent" />
              Station Load
            </h3>
            <div className="space-y-3 overflow-y-auto flex-1 px-1">
              {Object.keys(data.stationLoad).length === 0 ? (
                <div className="text-xs text-fg-subtle italic text-center mt-2">Kitchen idle</div>
              ) : (
                Object.entries(data.stationLoad).map(([cat, qty]: any) => (
                  <div key={cat}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>{cat}</span>
                      <span className="font-bold">{qty}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, (qty / 10) * 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}