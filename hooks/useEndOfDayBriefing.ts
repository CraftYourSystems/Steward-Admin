import { useQuery } from "@tanstack/react-query";
import { fetchEndOfDayBriefing, EndOfDayBriefingDTO } from "@/lib/needle-api";

export function useEndOfDayBriefing(date?: string) {
  return useQuery<EndOfDayBriefingDTO>({
    queryKey: ["needle-eod-briefing", date],
    queryFn: () => fetchEndOfDayBriefing(date),
    staleTime: 30000,
  });
}
