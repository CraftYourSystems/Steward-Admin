import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useLiveOpsSummary() {
  return useQuery({
    queryKey: ["live-ops-summary"],
    queryFn: async () => {
      const { data } = await api.get("/admin/live-ops/summary");
      return data.data;
    },
    // Refetch every 10 seconds for dynamic SLA transitions
    refetchInterval: 10000,
  });
}
