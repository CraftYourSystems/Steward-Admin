import api from "@/lib/axios";

export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type BriefingStatus = "OPTIMAL" | "WARNING" | "CRITICAL" | "NEUTRAL";
export type SectionType = "INVENTORY" | "FINANCE" | "KITCHEN" | "BRANCH" | "REPORTS";

export interface BriefingItem {
  id: string;
  key: string;
  params: Record<string, any>;
  priority: PriorityLevel;
  category: SectionType;
}

export interface BriefingMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  status: BriefingStatus;
}

export interface BriefingSection {
  type: SectionType;
  title: string;
  status: BriefingStatus;
  items: BriefingItem[];
  metrics: BriefingMetric[];
}

export interface BriefingHeader {
  title: string;
  targetDate: string;
  periodLabel: string;
  generatedAt: string;
  restaurantId: string;
  branchId?: string;
  version: "briefing.v1";
}

export interface MorningBriefingDTO {
  type: "MORNING";
  header: BriefingHeader;
  overallStatus: BriefingStatus;
  priorityItems: BriefingItem[];
  sections: BriefingSection[];
}

export interface EndOfDayBriefingDTO {
  type: "END_OF_DAY";
  header: BriefingHeader;
  overallStatus: BriefingStatus;
  priorityItems: BriefingItem[];
  sections: BriefingSection[];
}

export async function fetchMorningBriefing(date?: string): Promise<MorningBriefingDTO> {
  const params = date ? { date } : {};
  const response = await api.get<{ success: boolean; data: MorningBriefingDTO }>("/v1/needle/briefing/morning", { params });
  return response.data.data;
}

export async function fetchEndOfDayBriefing(date?: string): Promise<EndOfDayBriefingDTO> {
  const params = date ? { date } : {};
  const response = await api.get<{ success: boolean; data: EndOfDayBriefingDTO }>("/v1/needle/briefing/eod", { params });
  return response.data.data;
}
