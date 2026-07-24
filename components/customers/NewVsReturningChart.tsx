"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart as any), { ssr: false, loading: () => <Skeleton className="h-48 sm:h-56 w-full" /> }) as any;
const Bar = dynamic(() => import("recharts").then((m) => m.Bar as any), { ssr: false }) as any;
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis as any), { ssr: false }) as any;
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis as any), { ssr: false }) as any;
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid as any), { ssr: false }) as any;
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip as any), { ssr: false }) as any;
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer as any), { ssr: false }) as any;

const NEW_COLOR = "#8B5CF6"; // accent
const RETURNING_COLOR = "#10B981"; // success
const GRID = "#232328";
const AXIS = "#71717A";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  const newCount = payload.find(p => p.name === 'newCustomers')?.value || 0;
  const returningCount = payload.find(p => p.name === 'returningCustomers')?.value || 0;
  
  return (
    <div className="rounded-lg border border-white/10 bg-[#121214] px-3 py-2 shadow-elevated">
      <p className="mb-2 text-[10px] uppercase tracking-wider font-semibold text-fg-subtle">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NEW_COLOR }} />
            New
          </span>
          <span className="text-sm font-semibold text-fg num">{newCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RETURNING_COLOR }} />
            Returning
          </span>
          <span className="text-sm font-semibold text-fg num">{returningCount}</span>
        </div>
      </div>
    </div>
  );
});

interface Props { 
  data?: { date: string; newCustomers: number; returningCustomers: number }[]; 
  loading?: boolean; 
}

export const NewVsReturningChart = memo(function NewVsReturningChart({ data, loading }: Props) {
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
          <div className="label-xs mb-1">New vs Returning</div>
          <p className="text-[11px] text-fg-subtle">Customer acquisition over time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: NEW_COLOR }} />
            <span className="text-[11px] text-fg-muted font-medium">New</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RETURNING_COLOR }} />
            <span className="text-[11px] text-fg-muted font-medium">Returning</span>
          </div>
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
            <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="returningCustomers" stackId="a" fill={RETURNING_COLOR} radius={[0, 0, 4, 4]} barSize={24} />
              <Bar dataKey="newCustomers" stackId="a" fill={NEW_COLOR} radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});
