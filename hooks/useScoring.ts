import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useCompositeScores(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ["composite-scores", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/scoring/composite", { params });
      return data.data;
    },
    // Refetch every 5 minutes
    refetchInterval: 300000,
  });
}
