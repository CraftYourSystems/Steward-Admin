"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart as any), { ssr: false, loading: () => <Skeleton className="h-48 sm:h-56 w-full" /> }) as any;
const Line = dynamic(() => import("recharts").then((m) => m.Line as any), { ssr: false }) as any;
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis as any), { ssr: false }) as any;
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis as any), { ssr: false }) as any;
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid as any), { ssr: false }) as any;
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip as any), { ssr: false }) as any;
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer as any), { ssr: false }) as any;

const LINE_COLOR = "#3B82F6"; // info
const GRID = "#232328";
const AXIS = "#71717A";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 shadow-elevated">
      <p className="mb-1 text-[10px] uppercase tracking-wider font-semibold text-fg-subtle">{label}</p>
      <p className="text-sm font-semibold text-fg num">₹{payload[0].value?.toLocaleString("en-IN")}</p>
    </div>
  );
});

interface Props { data?: { date: string; averageSpend: number }[]; loading?: boolean; }

export const AverageSpendChart = memo(function AverageSpendChart({ data, loading }: Props) {
  const formatted = useMemo(() =>
    data?.map((d) => ({
      ...d,
      label: format(new Date(d.date), "dd MMM"),
    })), [data]
  );

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label-xs mb-1">Average Spend per Visit</div>
          <p className="text-[11px] text-fg-subtle">Trend over time</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-48 sm:h-56 w-full" />
      ) : !formatted || formatted.length === 0 ? (
        <div className="relative h-48 sm:h-56 w-full flex items-center justify-center">
          <p className="text-[13px] text-fg-muted font-medium">No data available</p>
        </div>
      ) : (
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v.toFixed(0)}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: LINE_COLOR, strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Line type="monotone" dataKey="averageSpend" stroke={LINE_COLOR} strokeWidth={2} dot={{ r: 3, fill: LINE_COLOR, strokeWidth: 2, stroke: "#0B0B0F" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});
