import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useMarketingSummary(params: { from: string; to: string }) {
  return useQuery({
    queryKey: ["marketing-summary", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/marketing/summary", { params });
      return data.data;
    },
  });
}
