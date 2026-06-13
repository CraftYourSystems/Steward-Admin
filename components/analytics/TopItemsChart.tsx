"use client";

import { memo, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopItem } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ACCENT = "#8B5CF6";
const GRID = "#232328";
const AXIS = "#71717A";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string; payload?: { name?: string } }>;
}

const CustomTooltip = memo(function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-elevated">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-fg-subtle mb-1">{payload[0]?.payload?.name}</p>
      <p className="text-sm font-semibold text-fg num">{payload[0].value} sold</p>
    </div>
  );
});

interface TopItemsChartProps { data?: TopItem[]; loading?: boolean; }

export const TopItemsChart = memo(function TopItemsChart({ data, loading }: TopItemsChartProps) {
  const formatted = useMemo(
    () =>
      data?.map((d) => ({
        name: d.name.length > 18 ? d.name.slice(0, 18) + "…" : d.name,
        qty: d.totalQuantity,
      })),
    [data]
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4">
        <div className="label-xs mb-1">Top Items</div>
        <p className="text-[11px] text-fg-subtle">Most ordered in period</p>
      </div>

      {loading ? (
        <Skeleton className="h-48 sm:h-56 w-full" />
      ) : !formatted || formatted.length === 0 ? (
        /* ── Ghost empty state ──────────────────────────────────────────── */
        <div className="relative h-48 sm:h-56 w-full">
          {/* Ghost vertical grid lines */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-full border-l border-dashed border-border/60" />
            ))}
          </div>
          {/* Ghost bar stubs */}
          <div className="absolute inset-y-4 left-[110px] right-4 flex flex-col justify-around pointer-events-none gap-2">
            {[60, 85, 45, 70, 35].map((w, i) => (
              <div
                key={i}
                className="h-4 rounded-r-md bg-accent/[0.08]"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          {/* Centered overlay message */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <p className="text-[13px] font-medium text-fg-muted">No orders yet</p>
            <p className="text-[11px] text-fg-subtle">Top items appear once orders come in</p>
          </div>
        </div>
      ) : (
        /* ── Live chart ─────────────────────────────────────────────────── */
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#A1A1AA" }} width={110} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              {/* Single consistent accent color — no 5-shade rainbow */}
              <Bar dataKey="qty" radius={[0, 4, 4, 0]} maxBarSize={22} fill={ACCENT} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});