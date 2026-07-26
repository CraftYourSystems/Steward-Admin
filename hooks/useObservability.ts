import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface SystemHealth {
  database: { status: string; latencyMs: number };
  redis: { status: string; latencyMs: number };
  storage: { status: string; capacityUsedPercent: number };
  backgroundWorkers: { status: string; activeWorkers: number };
  emailServer: { status: string; queueDepth: number };
  paymentGateway: { status: string; healthScorePercent: number };
  webSocket: { status: string; activeConnections: number };
  systemUptimeSeconds: number;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: string;
  action: string;
  ipAddress: string;
  device: string;
  correlationId: string;
  payload: any;
}

export interface ActivityLogResponse {
  logs: ActivityLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BackgroundJobItem {
  id: string;
  name: string;
  status: "completed" | "running" | "failed";
  retries: number;
  executionTimeMs: number;
  lastRun: string;
}

export interface ApiTelemetryData {
  requestVolume: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  slowEndpoints: Array<{
    path: string;
    avgLatencyMs: number;
    calls: number;
  }>;
  rateLimitsActive: number;
  authFailuresToday: number;
}

export interface NotificationLogItem {
  id: string;
  channel: "Email" | "SMS" | "WhatsApp" | "Push Notification";
  recipient: string;
  subject: string;
  status: "delivered" | "failed" | "pending";
  retries: number;
  sentAt: string;
  error?: string;
}

export interface DataIntegrityData {
  issuesCount: number;
  missingRecipes: Array<{ entityId: string; name: string; issue: string }>;
  negativeStock: Array<{ entityId: string; name: string; issue: string }>;
  deductionIssues: Array<{ entityId: string; name: string; issue: string }>;
}

export function useSystemHealth() {
  return useQuery<SystemHealth>({
    queryKey: ["observability-health"],
    queryFn: async () => {
      const res = await api.get("/v1/admin/observability/health");
      return res.data.data;
    },
    refetchInterval: 10000, // Poll every 10s for active dashboard uptime
  });
}

export function useActivityLogs(params: { search?: string; module?: string; page?: number; limit?: number }) {
  return useQuery<ActivityLogResponse>({
    queryKey: ["observability-activity-logs", params],
    queryFn: async () => {
      const res = await api.get("/v1/admin/observability/activity-logs", { params });
      return res.data;
    },
    staleTime: 5000,
  });
}

export function useBackgroundJobs() {
  return useQuery<BackgroundJobItem[]>({
    queryKey: ["observability-background-jobs"],
    queryFn: async () => {
      const res = await api.get("/v1/admin/observability/background-jobs");
      return res.data.data;
    },
    staleTime: 10000,
  });
}

export function useApiTelemetry() {
  return useQuery<ApiTelemetryData>({
    queryKey: ["observability-api-telemetry"],
    queryFn: async () => {
      const res = await api.get("/v1/admin/observability/api-telemetry");
      return res.data.data;
    },
    staleTime: 10000,
  });
}

export function useNotificationsLog() {
  return useQuery<NotificationLogItem[]>({
    queryKey: ["observability-notifications"],
    queryFn: async () => {
      const res = await api.get("/v1/admin/observability/notifications");
      return res.data.data;
    },
    staleTime: 10000,
  });
}

export function useDataIntegrity() {
  return useQuery<DataIntegrityData>({
    queryKey: ["observability-data-integrity"],
    queryFn: async () => {
      const res = await api.get("/v1/admin/observability/data-integrity");
      return res.data.data;
    },
    staleTime: 30000,
  });
}
