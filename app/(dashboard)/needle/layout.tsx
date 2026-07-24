"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOperationalPhase } from "@/hooks/useOperationalPhase";
import { resolveNeedleExperience } from "@/lib/needle";
import { cn } from "@/lib/utils";

const needleSections = [
  { id: "today",       label: "Today",       href: "/needle/today",       released: true },
  { id: "operations",  label: "Operations",  href: "/needle/operations",  released: true },
  { id: "insights",    label: "Insights",    href: "/needle/insights",    released: true },
  { id: "ask",         label: "Ask",         href: "/needle/ask",         released: true },
];

// Map phase → which tab should show the experience badge
const PHASE_BADGE_TAB: Record<string, string> = {
  opening: "today",
  "active-service": "operations",
  quiet: "today",
  closing: "today",
};

export default function NeedleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { phase } = useOperationalPhase();
  const experience = resolveNeedleExperience(phase);
  const releasedSections = needleSections.filter((section) => section.released);
  const badgeTabId = PHASE_BADGE_TAB[phase] || "today";

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Needle Tabs Header ─────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-0 lg:px-6 lg:pt-6 border-b border-white/5 bg-bg select-none shrink-0">
        <div className="flex space-x-1">
          {releasedSections.map((section) => {
            const active = pathname === section.href;
            const showBadge = section.id === badgeTabId;
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "px-4 py-2 text-[13px] font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2",
                  active
                    ? "bg-white/10 text-fg border-b-2 border-accent animate-fade-in"
                    : "text-fg-muted hover:text-fg hover:bg-white/5"
                )}
              >
                {section.label}
                {showBadge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/20 px-1.5 py-0.5 rounded-full leading-none">
                    {experience.title}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 bg-black/50">
        {children}
      </div>
    </div>
  );
}
