import { memo } from "react";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  trend?: { value: number; label?: string };
  accent?: "accent" | "info" | "success" | "danger" | "warning";
  size?: "default" | "lg";
  /** If provided and returns true, the value text turns text-danger */
  alertWhen?: (value: string) => boolean;
}

const accentMap = {
  accent:  { text: "text-accent",   glow: "group-hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]",  icon: "bg-accent/10 border-accent/20" },
  info:    { text: "text-info",     glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]",  icon: "bg-info/10 border-info/20" },
  success: { text: "text-success",  glow: "group-hover:shadow-[0_0_20px_rgba(34,197,94,0.12)]",   icon: "bg-success/10 border-success/20" },
  danger:  { text: "text-danger",   glow: "group-hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]",   icon: "bg-danger/10 border-danger/20" },
  warning: { text: "text-warning",  glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",  icon: "bg-warning/10 border-warning/20" },
};

function KpiSkeleton({ isLg }: { isLg?: boolean }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3 w-16 rounded-md bg-surface-3" />
      <div className={cn("w-24 rounded-md bg-surface-3", isLg ? "h-9" : "h-7")} />
      <div className="h-3 w-12 rounded-md bg-surface-3" />
    </div>
  );
}

// Memoized — only re-renders when its own props change
export const KpiCard = memo(function KpiCard({
  title, value, icon: Icon, description, loading,
  accent = "accent", trend, size = "default", alertWhen,
}: KpiCardProps) {
  const { text, glow, icon: iconBg } = accentMap[accent];
  const isLg = size === "lg";
  const isAlert = !loading && alertWhen ? alertWhen(value) : false;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-surface",
        // lg: accent top border for hero treatment
        isLg && "border-t-2 border-t-accent/40",
        isLg ? "p-6" : "p-4",
        "transition-all duration-200",
        "hover:border-border-strong",
        // Subtle inner top highlight for gloss effect
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        // Accent glow on hover (per-color)
        glow
      )}
    >
      {/* Top row — label + icon */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="label-xs">{title}</span>
        <div className={cn(
          "grid place-items-center rounded-lg border transition-colors",
          isLg ? "h-8 w-8" : "h-7 w-7",
          // lg cards keep their accent badge; secondary cards use neutral
          isLg ? iconBg : "bg-surface-2 border-border"
        )}>
          <Icon className={cn(isLg ? "h-4 w-4" : "h-3.5 w-3.5", text)} />
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <KpiSkeleton isLg={isLg} />
      ) : (
        <>
          <div className={cn(
            isLg ? "text-[36px]" : "text-[22px] sm:text-[24px]",
            "font-semibold tracking-tight num leading-none",
            "transition-colors duration-150",
            // alertWhen overrides value color to danger
            isAlert ? "text-danger" : "text-fg"
          )}>
            {value}
          </div>

          {/* Trend / description row */}
          <div className="mt-2.5 flex items-center gap-2 min-h-[18px]">
            {trend && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-semibold num rounded-full px-1.5 py-0.5",
                trend.value >= 0
                  ? "text-success bg-success/10"
                  : "text-danger bg-danger/10"
              )}>
                {trend.value >= 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                {trend.value >= 0 ? "+" : ""}{trend.value.toFixed(1)}%
              </span>
            )}
            {(description || trend?.label) && (
              <span className="text-[11px] text-fg-subtle">
                {trend?.label ?? description}
              </span>
            )}
          </div>
        </>
      )}

      {/* Decorative corner gradient — always visible at 30% on lg, hover only otherwise */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 h-16 w-16 transition-opacity duration-300",
          "rounded-bl-[40px]",
          isLg ? "opacity-30 group-hover:opacity-60" : "opacity-0 group-hover:opacity-100"
        )}
        style={{
          background: `radial-gradient(circle at top right, var(--tw-shadow-color, rgba(139,92,246,0.08)), transparent 70%)`,
        }}
        aria-hidden
      />
    </div>
  );
});
