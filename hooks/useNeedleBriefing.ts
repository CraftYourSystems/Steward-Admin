import { useQuery } from "@tanstack/react-query";
import { fetchMorningBriefing, fetchEndOfDayBriefing, MorningBriefingDTO, EndOfDayBriefingDTO } from "@/lib/needle-api";

export function useMorningBriefing(date?: string) {
  return useQuery<MorningBriefingDTO>({
    queryKey: ["needle-briefing-morning", date],
    queryFn: () => fetchMorningBriefing(date),
    staleTime: 30000,
  });
}

export function useEndOfDayBriefing(date?: string) {
  return useQuery<EndOfDayBriefingDTO>({
    queryKey: ["needle-briefing-eod", date],
    queryFn: () => fetchEndOfDayBriefing(date),
    staleTime: 30000,
  });
}
