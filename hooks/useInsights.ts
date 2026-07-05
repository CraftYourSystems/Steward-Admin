import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useInsights() {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const { data } = await api.get("/admin/insights");
      return data.data;
    }
  });
}

export function useGenerateInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/admin/insights/generate");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-insights"] });
    }
  });
}

export function useUpdateInsightStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: "DONE" | "DISMISSED" }) => {
      const { data } = await api.patch(`/admin/insights/${id}`, { status });
      return data;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["ai-insights"] });
      const previous = qc.getQueryData(["ai-insights"]);
      qc.setQueryData(["ai-insights"], (old: any) => old?.filter((i: any) => i.id !== id));
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) qc.setQueryData(["ai-insights"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["ai-insights"] });
    }
  });
}
