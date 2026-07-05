"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  AnalyticsSummary,
  RevenueDataPoint,
  TopItem,
  HourlyDataPoint,
  ItemPerformanceData,
  TodaysInsightsData,
  PeakHourData,
  HealthScoreData,
  ItemCombination,
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

export function useItemPerformance(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-item-performance", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ItemPerformanceData>>(
        "/admin/analytics/item-performance",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useTodaysInsights() {
  return useQuery({
    queryKey: ["analytics-insights"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<TodaysInsightsData>>(
        "/admin/analytics/insights"
      );
      return data.data;
    },
    staleTime:       TODAY_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: TODAY_REFETCH_MS,
  });
}

export function usePeakHour(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-peak-hour", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<PeakHourData>>(
        "/admin/analytics/peak-hour",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useHealthScore() {
  return useQuery({
    queryKey: ["analytics-health-score"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<HealthScoreData>>(
        "/admin/analytics/health-score"
      );
      return data.data;
    },
    staleTime: ANALYTICS_STALE_TIME,
    gcTime:    ANALYTICS_GC_TIME,
  });
}

export function useItemCombinations(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-combinations", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ItemCombination[]>>(
        "/admin/analytics/combinations",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useChannelSplit(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-channel-split", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ channel: string; orders: number }[]>>(
        "/admin/analytics/channel-split",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useRefundReasons(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-refund-reasons", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ reason: string | null; count: number }[]>>(
        "/admin/analytics/refund-reasons",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}

export function useOrderAccuracy(params: DateParams, activeRange?: string) {
  const isToday = activeRange === "today";
  return useQuery({
    queryKey: ["analytics-accuracy", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ totalCompleted: number; correctedOrders: number; accuracyPercentage: number }>>(
        "/admin/analytics/accuracy",
        { params }
      );
      return data.data;
    },
    staleTime:       isToday ? TODAY_STALE_TIME : ANALYTICS_STALE_TIME,
    gcTime:          ANALYTICS_GC_TIME,
    refetchInterval: isToday ? TODAY_REFETCH_MS : false,
  });
}
