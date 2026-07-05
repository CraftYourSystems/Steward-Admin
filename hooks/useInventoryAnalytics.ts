import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useWastePercentage() {
  return useQuery({
    queryKey: ["inventory-waste"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/waste-percentage");
      return data.data as { id: string; name: string; unit: string; wastedQuantity: number; theoreticalUsage: number; wastePercent: number }[];
    }
  });
}

export function useStockoutIncidents() {
  return useQuery({
    queryKey: ["inventory-stockouts"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/stockout-incidents");
      return data.data as { id: string; ingredientId: string; name: string; unit: string; createdAt: string; resolvedAt: string | null; durationMins: number | null }[];
    }
  });
}

export function useCostTrends() {
  return useQuery({
    queryKey: ["inventory-cost-trends"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/cost-trends");
      return data.data as { ingredientId: string; name: string; maxSpikePercent: number; isVolatile: boolean; changes: { date: string; oldCost: number; newCost: number; percentChange: number }[] }[];
    }
  });
}
