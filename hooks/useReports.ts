import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useGeneratedReport(params: { from: string; to: string }, enabled: boolean) {
  return useQuery({
    queryKey: ["generated-report", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/reports/generate", { params });
      return data.data;
    },
    enabled,
  });
}
