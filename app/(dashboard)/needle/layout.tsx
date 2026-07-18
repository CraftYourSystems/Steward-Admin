"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const needleSections = [
  { id: "briefing",    label: "Briefing",    href: "/needle/briefing",    released: true },
  { id: "live-health", label: "Live Health", href: "/needle/live-health",  released: true },
  { id: "bearings",    label: "Bearings",    href: "/needle/bearings",     released: false },
  { id: "drift",       label: "Drift",       href: "/needle/drift",        released: false },
  { id: "forecasts",   label: "Forecasts",   href: "/needle/forecasts",    released: false },
  { id: "ask",         label: "Ask Needle",  href: "/needle/ask",          released: false },
];

export default function NeedleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const releasedSections = needleSections.filter((section) => section.released);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Needle Tabs Header ─────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-0 lg:px-6 lg:pt-6 border-b border-white/5 bg-bg select-none shrink-0">
        <div className="flex space-x-1">
          {releasedSections.map((section) => {
            const active = pathname === section.href;
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "px-4 py-2 text-[13px] font-semibold rounded-t-lg transition-colors cursor-pointer",
                  active
                    ? "bg-white/10 text-fg border-b-2 border-accent animate-fade-in"
                    : "text-fg-muted hover:text-fg hover:bg-white/5"
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
