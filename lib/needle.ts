import type { OperationalPhaseType } from "@/hooks/useOperationalPhase";

// ─── Experience Type ──────────────────────────────────────────────────────────

export interface NeedleExperience {
  /** The anchor title shown to the owner (e.g. "Opening Readiness") */
  title: string;
  /** Contextual greeting beneath the title */
  greeting: string;
  /**
   * The owner's operational question this experience answers.
   * Internal / documentary only — not rendered in v1.
   * Useful for future contextual help or onboarding flows.
   */
  question: string;
}

// ─── Experience Resolver ──────────────────────────────────────────────────────
//
// Translates an internal operational phase into a human-facing experience.
//
// Future: this resolver can be extended to support restaurant-type-specific
// experiences (café, fine dining, cloud kitchen), branch overrides,
// seasonal variations, or premium Needle tiers — all without touching
// the phase engine or any component.
//

const EXPERIENCES: Record<OperationalPhaseType, NeedleExperience> = {
  opening: {
    title: "Opening Readiness",
    question: "Can we open?",
    greeting:
      "Good morning. Here's what to prepare before today's service begins.",
  },
  "active-service": {
    title: "Live Operations",
    question: "What needs attention?",
    greeting:
      "Service is underway. Showing items that need your attention.",
  },
  quiet: {
    title: "Operations Review",
    question: "How are we doing?",
    greeting:
      "Operations are calm. Review recommendations at your pace.",
  },
  closing: {
    title: "Closing Summary",
    question: "Can we close?",
    greeting:
      "Today's service has concluded. Here's your operational summary.",
  },
};

export function resolveNeedleExperience(
  phase: OperationalPhaseType
): NeedleExperience {
  return EXPERIENCES[phase];
}
