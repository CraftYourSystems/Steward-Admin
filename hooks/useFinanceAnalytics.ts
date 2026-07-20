import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface ChannelSplit {
  channel: string;
  percent: number;
  val: number;
}

export interface ItemMargin {
  name: string;
  marginPct: number;
}

export interface FinanceSummaryData {
  revenue: number;
  grossSales: number;
  netSales: number;
  todayRevenue: number;
  revenueGrowth: number;

  todayOrderCount: number;
  totalOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  avgItemsPerTicket: number;
  totalRefunds: number;
  outstandingReceivables: number;

  foodCost: number | null;
  foodCostPct: number | null;
  laborCost: number | null;
  laborCostPct: number | null;
  wasteCost: number;
  operationalContribution: number | null;
  laborCostMessage?: string;

  channelSplits: ChannelSplit[];
  topMarginItems: ItemMargin[];
  lowestMarginItems: ItemMargin[];
}

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  foodCost: number;
  profit: number;
}

export function useFinanceSummary(params: { from: string; to: string }) {
  return useQuery({
    queryKey: ["finance-summary", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/finance/summary", { params });
      return data.data as FinanceSummaryData;
    },
  });
}

export function useFinanceTrend(params: { from: string; to: string; interval: "daily" | "weekly" }) {
  return useQuery({
    queryKey: ["finance-trend", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/finance/trend", { params });
      return data.data as RevenueTrendItem[];
    },
  });
}
