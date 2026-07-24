import api from "@/lib/axios";
import { Decision } from "@/components/needle/DecisionCard";
import todayFixture from "@/fixtures/needle/today.json";
import operationsFixture from "@/fixtures/needle/operations.json";
import insightsFixture from "@/fixtures/needle/insights.json";

export type DataMode = "production" | "demo" | "mock";

export interface NeedleSignalsResponse {
  mode: DataMode;
  healthScore?: {
    total: number;
    breakdown: Record<string, number>;
  };
  summaryText?: string;
  quietModeForecast?: {
    expectedOrders: number;
    peakWindow: string;
    weather: string;
  };
  signals: Decision[];
}

export async function fetchNeedleSignals(
  section: "today" | "operations" | "insights"
): Promise<NeedleSignalsResponse> {
  const mode = (process.env.NEXT_PUBLIC_NEEDLE_DATA_MODE as DataMode) || "mock";

  // Mode 3: Isolated Frontend Development (JSON Fixtures)
  if (mode === "mock") {
    if (section === "today") return { mode: "mock", ...(todayFixture as any) };
    if (section === "operations") return { mode: "mock", ...(operationsFixture as any) };
    if (section === "insights") return { mode: "mock", ...(insightsFixture as any) };
  }

  // Mode 1 & 2: Production / Demo (Hits live backend engine)
  try {
    const response = await api.get<{ success: boolean; data: NeedleSignalsResponse }>(
      "/v1/needle/signals",
      { params: { section, mode } }
    );
    return response.data.data;
  } catch (error) {
    // Graceful fallback to mock fixtures if backend endpoint is unavailable
    console.warn(`[Needle Engine API] ${mode} mode endpoint unavailable. Falling back to fixture.`);
    if (section === "today") return { mode, ...(todayFixture as any) };
    if (section === "operations") return { mode, ...(operationsFixture as any) };
    return { mode, ...(insightsFixture as any) };
  }
}

// ─── Legacy DTO Exports for Backward Compatibility ──────────────────────────────
export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type BriefingStatus = "OPTIMAL" | "WARNING" | "CRITICAL" | "NEUTRAL";
export type SectionType = "INVENTORY" | "FINANCE" | "KITCHEN" | "BRANCH" | "REPORTS";

export interface MorningBriefingDTO {
  type: "MORNING";
  header: any;
  overallStatus: BriefingStatus;
  priorityItems: any[];
  sections: any[];
}

export interface EndOfDayBriefingDTO {
  type: "END_OF_DAY";
  header: any;
  overallStatus: BriefingStatus;
  priorityItems: any[];
  sections: any[];
}

export async function fetchMorningBriefing(date?: string): Promise<MorningBriefingDTO> {
  const response = await api.get<{ success: boolean; data: MorningBriefingDTO }>("/v1/needle/briefing/morning", { params: { date } });
  return response.data.data;
}

export async function fetchEndOfDayBriefing(date?: string): Promise<EndOfDayBriefingDTO> {
  const response = await api.get<{ success: boolean; data: EndOfDayBriefingDTO }>("/v1/needle/briefing/eod", { params: { date } });
  return response.data.data;
}
