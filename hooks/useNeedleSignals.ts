import { useQuery } from "@tanstack/react-query";
import { fetchNeedleSignals, NeedleSignalsResponse } from "@/lib/needle-api";

export function useNeedleSignals(section: "today" | "operations" | "insights") {
  return useQuery<NeedleSignalsResponse>({
    queryKey: ["needle-signals", section],
    queryFn: () => fetchNeedleSignals(section),
    staleTime: 30000,
  });
}
