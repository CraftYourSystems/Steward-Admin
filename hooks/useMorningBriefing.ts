import { useQuery } from "@tanstack/react-query";
import { fetchMorningBriefing, MorningBriefingDTO } from "@/lib/needle-api";

export function useMorningBriefing(date?: string) {
  return useQuery<MorningBriefingDTO>({
    queryKey: ["needle-morning-briefing", date],
    queryFn: () => fetchMorningBriefing(date),
    staleTime: 30000,
  });
}
