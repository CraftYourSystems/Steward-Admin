import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface HeatmapEntryData {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface ReportSummaryData {
  restaurantId: string;
  period: { from: string; to: string; periodLabel?: string };
  sales: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    avgOrderValue: number;
    totalRefunds: number;
    revenueSeries: { date: string; revenue: number }[];
    heatmap: HeatmapEntryData[];
    channelSplits: { channel: string; orders: number }[];
  };
  inventory: {
    totalStockValue: number | null;
    lowStockItemsCount: number;
    wasteTotalValue: number;
  };
  customers: {
    totalDistinctCustomers: number;
    avgOrdersPerCustomer: number;
    avgCustomerRevenue: number | null;
  };
  tax: {
    taxableSales: number;
    totalTaxCollected: number;
    taxRatePct: number | null;
  };
}

export function useReportsSummary(periodPreset = '30d', enabled = true) {
  return useQuery({
    queryKey: ["reports-summary", periodPreset],
    queryFn: async () => {
      const { data } = await api.get(`/reports/summary?period=${periodPreset}`);
      return data.data as ReportSummaryData;
    },
    enabled,
    staleTime: 60000,
  });
}

export function useCombinedReport(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ["reports-combined", from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/generate?from=${from}&to=${to}`);
      return data.data as ReportSummaryData;
    },
    enabled,
    staleTime: 60000,
  });
}

export function useGeneratedReport(range: { from: string; to: string }, enabled = true) {
  return useCombinedReport(range.from, range.to, enabled && !!range.from && !!range.to);
}

