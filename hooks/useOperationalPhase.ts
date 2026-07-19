"use client";

import { useLiveOpsSummary } from "@/hooks/useLiveOps";

// ─── Phase Types ──────────────────────────────────────────────────────────────

export type OperationalPhaseType = "opening" | "active-service" | "quiet" | "closing";

export interface UseOperationalPhaseReturn {
  phase: OperationalPhaseType;
  isServiceActive: boolean;
  isLoading: boolean;
}

// ─── Phase Resolver ───────────────────────────────────────────────────────────
//
// Isolated resolution function. Currently uses operational signals with
// time-of-day as a fallback heuristic for disambiguating zero-activity states.
//
// Future: swap this to read restaurant.businessHours, branch.schedule,
// or holiday.calendar without touching any Needle component.
//

interface PhaseSignals {
  activeOrderCount: number;
  kitchenStationsActive: number;
  staffOnline: number;
  hour: number;
}

export function resolvePhase(signals: PhaseSignals): OperationalPhaseType {
  const { activeOrderCount, kitchenStationsActive, hour } = signals;

  // Primary signal: operational activity overrides everything
  if (activeOrderCount > 0 || kitchenStationsActive > 0) {
    return "active-service";
  }

  // Secondary: time-of-day heuristics for zero-activity disambiguation
  // These are fallback heuristics only — not business hour definitions
  if (hour < 14) {
    return "opening";
  }

  if (hour >= 21) {
    return "closing";
  }

  return "quiet";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOperationalPhase(): UseOperationalPhaseReturn {
  const { data, isLoading } = useLiveOpsSummary();

  if (isLoading || !data) {
    return { phase: "opening", isServiceActive: false, isLoading: true };
  }

  const activeOrderCount = data.queue?.activeCount ?? 0;
  const kitchenStationsActive = Object.keys(data.stationLoad || {}).length;
  const staffOnline = data.staff?.online ?? 0;
  const hour = new Date().getHours();

  const phase = resolvePhase({
    activeOrderCount,
    kitchenStationsActive,
    staffOnline,
    hour,
  });

  return {
    phase,
    isServiceActive: phase === "active-service",
    isLoading: false,
  };
}
