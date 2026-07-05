import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useFinanceSummary(params: { from: string; to: string }) {
  return useQuery({
    queryKey: ["finance-summary", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/finance/summary", { params });
      return data.data;
    },
  });
}

export function useFinanceTrend(params: { from: string; to: string; interval: "daily" | "weekly" }) {
  return useQuery({
    queryKey: ["finance-trend", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/finance/trend", { params });
      return data.data;
    },
  });
}
