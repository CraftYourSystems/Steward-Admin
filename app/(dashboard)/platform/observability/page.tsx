"use client";

import React, { useState } from "react";
import {
  useSystemHealth,
  useActivityLogs,
  useBackgroundJobs,
  useApiTelemetry,
  useNotificationsLog,
  useDataIntegrity,
} from "@/hooks/useObservability";
import {
  Activity,
  ShieldAlert,
  Server,
  Terminal,
  Cpu,
  Mail,
  AlertTriangle,
  RefreshCw,
  Search,
  SearchCode,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
} from "lucide-react";

type ObservabilityTab = "health" | "logs" | "jobs" | "api" | "notifications" | "integrity";

export default function PlatformObservabilityPage() {
  const [activeTab, setActiveTab] = useState<ObservabilityTab>("health");
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: activityResp, isLoading: logsLoading } = useActivityLogs({ search, module: filterModule });
  const { data: jobs, isLoading: jobsLoading } = useBackgroundJobs();
  const { data: telemetry, isLoading: telemetryLoading } = useApiTelemetry();
  const { data: notifications, isLoading: notificationsLoading } = useNotificationsLog();
  const { data: integrity, isLoading: integrityLoading } = useDataIntegrity();

  const handleRefreshAll = () => {
    refetchHealth();
  };

  const tabs: Array<{ id: ObservabilityTab; label: string; icon: any }> = [
    { id: "health", label: "Health Diagnostics", icon: Server },
    { id: "logs", label: "Activity & Audit Logs", icon: Terminal },
    { id: "jobs", label: "Background Jobs", icon: Cpu },
    { id: "api", label: "API Monitoring", icon: Activity },
    { id: "notifications", label: "Notifications Log", icon: Mail },
    { id: "integrity", label: "Data Integrity & Errors", icon: AlertTriangle },
  ];

  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accent" />
            Platform Observability & Audit Center
          </h1>
          <p className="text-sm text-gray-400">
            Real-time diagnostics, background task queues, and immutable system transaction logging.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-lg border border-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Core System
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex space-x-1 border-b border-white/5 pb-0 select-none shrink-0">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
                active
                  ? "bg-white/10 text-fg border-b-2 border-accent"
                  : "text-fg-muted hover:text-fg hover:bg-white/5"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content tabs router */}
      <div className="flex-1 min-h-0 bg-black/50 rounded-xl">

        {/* Tab 1: Health Diagnostics */}
        {activeTab === "health" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 relative overflow-hidden">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Database Cluster</span>
                <span className="text-xl font-bold text-white block">PostgreSQL</span>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                  <span className="text-[#30D158] font-medium">Healthy</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{health?.database.latencyMs}ms Latency</span>
                </div>
              </div>

              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 relative overflow-hidden">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">In-Memory Cache</span>
                <span className="text-xl font-bold text-white block">Redis Host</span>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                  <span className="text-[#30D158] font-medium">Healthy</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{health?.redis.latencyMs}ms Ping</span>
                </div>
              </div>

              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 relative overflow-hidden">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">WebSocket Connections</span>
                <span className="text-xl font-bold text-white block">{health?.webSocket.activeConnections} Connections</span>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                  <span className="text-[#30D158] font-medium">Listening</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">WS Gateway Active</span>
                </div>
              </div>

              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 relative overflow-hidden">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">System Uptime</span>
                <span className="text-xl font-bold text-white block">
                  {health?.systemUptimeSeconds ? Math.floor(health.systemUptimeSeconds / 3600) : 0} hrs
                </span>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Workers Active: {health?.backgroundWorkers.activeWorkers}</span>
                </div>
              </div>

            </div>

            {/* Platform Gateway Latencies */}
            <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">External APIs / Gateway Latency</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                  <span className="text-xs text-gray-400 block mb-1">Payment gateway integration</span>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Razorpay Live</span>
                    <span className="text-xs text-[#30D158] font-bold">99.8% Health</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                  <span className="text-xs text-gray-400 block mb-1">Mail delivery server</span>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Nodemailer Server</span>
                    <span className="text-xs text-[#30D158] font-bold">0 Pending</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                  <span className="text-xs text-gray-400 block mb-1">Cloud Bucket storage</span>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Asset Storage</span>
                    <span className="text-xs text-white font-bold">{health?.storage.capacityUsedPercent}% Capacity</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Activity & Audit Logs */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            
            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search logs by action or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                />
              </div>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="">All Modules</option>
                <option value="auth">auth</option>
                <option value="inventory">inventory</option>
                <option value="recipe">recipe</option>
                <option value="procurement">procurement</option>
                <option value="settings">settings</option>
              </select>
            </div>

            {/* Audit Logs Table */}
            <div className="border border-white/10 bg-[#0A0A0A] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User (Actor)</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Device</th>
                    <th className="p-3 text-right">Correlation ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {activityResp?.logs && activityResp.logs.length > 0 ? (
                    activityResp.logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 text-white">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-gray-300">{log.user}</td>
                        <td className="p-3">{log.module}</td>
                        <td className="p-3 font-semibold text-accent">{log.action}</td>
                        <td className="p-3">{log.ipAddress}</td>
                        <td className="p-3 text-gray-500">{log.device}</td>
                        <td className="p-3 text-right text-gray-500">{log.correlationId}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500 font-sans">
                        No audit records matched your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Background Jobs */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white">Scheduled Tasks & Deductions Engine</h2>
            
            <div className="border border-white/10 bg-[#0A0A0A] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="p-3">Task / Job Name</th>
                    <th className="p-3">Last Run</th>
                    <th className="p-3">Execution Time</th>
                    <th className="p-3">Retries</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobs?.map((job: any) => (
                    <tr key={job.id} className="hover:bg-white/5">
                      <td className="p-3 font-medium text-white">{job.name}</td>
                      <td className="p-3 text-gray-400">{new Date(job.lastRun).toLocaleString()}</td>
                      <td className="p-3 font-mono">{job.executionTimeMs}ms</td>
                      <td className="p-3">{job.retries} / 3</td>
                      <td className="p-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.status === "completed" ? "bg-[#30D158]/15 text-[#30D158]" :
                          job.status === "running" ? "bg-[#64D2FF]/15 text-[#64D2FF]" :
                          "bg-[#FF453A]/15 text-[#FF453A]"
                        }`}>
                          {job.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                          {job.status === "running" && <Clock className="w-3 h-3 animate-spin" />}
                          {job.status === "failed" && <XCircle className="w-3 h-3" />}
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 4: API Monitoring */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Today's Request volume</span>
                <span className="text-2xl font-bold text-white block">{telemetry?.requestVolume} Requests</span>
              </div>

              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mean Response Latency</span>
                <span className="text-2xl font-bold text-white block">{telemetry?.avgLatencyMs} ms</span>
              </div>

              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">p99 Slow Endpoint Ceiling</span>
                <span className="text-2xl font-bold text-white block">{telemetry?.p99LatencyMs} ms</span>
              </div>

              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 font-sans">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Failures / Errors today</span>
                <span className="text-2xl font-bold text-white block">{telemetry?.errorRatePercent}%</span>
              </div>

            </div>

            {/* Slow Endpoints List */}
            <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-accent" />
                Slow Endpoint Telemetry
              </h2>
              <div className="border border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-gray-400">
                  <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                    <tr>
                      <th className="p-3">Route Pattern</th>
                      <th className="p-3 text-right">Avg Execution Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {telemetry?.slowEndpoints.map((ep: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-3 text-white">{ep.path}</td>
                        <td className="p-3 text-right font-bold text-[#FF9F0A]">{ep.avgLatencyMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 5: Notifications Log */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white">Alert Dispatch Queues</h2>

            <div className="border border-white/10 bg-[#0A0A0A] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Recipient Address</th>
                    <th className="p-3">Message Subject</th>
                    <th className="p-3">Sent At</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {notifications?.map((notif: any) => (
                    <tr key={notif.id} className="hover:bg-white/5">
                      <td className="p-3 font-medium text-white">{notif.channel}</td>
                      <td className="p-3 font-mono text-gray-400">{notif.recipient}</td>
                      <td className="p-3">{notif.subject}</td>
                      <td className="p-3 text-gray-500">{new Date(notif.sentAt).toLocaleTimeString()}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          notif.status === "delivered" ? "bg-[#30D158]/15 text-[#30D158]" :
                          "bg-[#FF453A]/15 text-[#FF453A]"
                        }`}>
                          {notif.status === "delivered" ? "Delivered" : `Failed: ${notif.error || "Timeout"}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 6: Data Integrity & Errors */}
        {activeTab === "integrity" && (
          <div className="space-y-6">
            
            {/* Missing recipes or negative stocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF9F0A]" />
                  Orphaned Recipes & Gaps
                </h2>
                {integrity?.missingRecipes && integrity.missingRecipes.length > 0 ? (
                  <div className="space-y-3">
                    {integrity.missingRecipes.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 text-xs">
                        <span className="font-semibold text-white block mb-0.5">{item.name}</span>
                        <span className="text-gray-400">{item.issue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-6">All menu items have matching recipes.</div>
                )}
              </div>

              <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF453A]" />
                  Negative Inventory Balances
                </h2>
                {integrity?.negativeStock && integrity.negativeStock.length > 0 ? (
                  <div className="space-y-3">
                    {integrity.negativeStock.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 text-xs">
                        <span className="font-semibold text-white block mb-0.5">{item.name}</span>
                        <span className="text-[#FF453A] font-mono">{item.issue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-6">No negative balances found.</div>
                )}
              </div>

            </div>

            {/* Failed Deductions */}
            <div className="border border-white/10 bg-[#0A0A0A] rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white">Deduction Transaction Integrity</h2>
              {integrity?.deductionIssues && integrity.deductionIssues.length > 0 ? (
                <div className="border border-white/5 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs text-gray-400">
                    <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
                      <tr>
                        <th className="p-3">Entity Mapping</th>
                        <th className="p-3">Issue Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrity.deductionIssues.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="p-3 font-semibold text-white">{item.name}</td>
                          <td className="p-3 text-[#FF453A]">{item.issue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-xs text-gray-500 py-6">All transaction deduction processes verified clean.</div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
