"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  AnalyticsSummary,
  RevenueDataPoint,
  TopItem,
  HourlyDataPoint,
  ApiSuccess,
} from "@/types";

interface DateParams {
  from: string;
  to: string;
}

// For "today" range: short stale window + auto-refresh
// For historical ranges: 5-minute cache is fine
const ANALYTICS_STALE_TIME = 5 * 60 * 1000;  // 5 minutes (historical)
const TODAY_STALE_TIME     = 30_000;           // 30 seconds (live view)
const ANALYTICS_GC_TIME    = 10 * 60 * 1000;  // keep in cache 10 minutes
const TODAY_REFETCH_MS     = 60_000;           // re-fetch every 60 s when "today"

export function useAnalyticsSummary(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-summary", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<AnalyticsSummary>>(
        "/admin/analytics/summary",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    // Auto-poll every 60 s while the "today" tab is active so revenue
    // updates without requiring a manual refresh or socket event.
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useRevenueData(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-revenue", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<RevenueDataPoint[]>>(
        "/admin/analytics/revenue",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useTopItems(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-top-items", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<TopItem[]>>(
        "/admin/analytics/top-items",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useHourlyData(params: DateParams) {
  return useQuery({
    queryKey: ["analytics-hourly", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<HourlyDataPoint[]>>(
        "/admin/analytics/hourly",
        { params }
      );
      return data.data;
    },
    staleTime: ANALYTICS_STALE_TIME,
    gcTime:    ANALYTICS_GC_TIME,
  });
}
