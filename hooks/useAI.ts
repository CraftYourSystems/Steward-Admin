import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useAIDashboard() {
  return useQuery({
    queryKey: ["ai-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/ai/dashboard");
      return data.data;
    }
  });
}

export function useProfitOpportunities() {
  return useQuery({
    queryKey: ["ai-profit-opportunities"],
    queryFn: async () => {
      const { data } = await api.get("/admin/ai/profit-opportunities");
      return data.data;
    }
  });
}
