"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart as any), { ssr: false, loading: () => <Skeleton className="h-48 sm:h-56 w-full" /> }) as any;
const Bar = dynamic(() => import("recharts").then((m) => m.Bar as any), { ssr: false }) as any;
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis as any), { ssr: false }) as any;
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis as any), { ssr: false }) as any;
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid as any), { ssr: false }) as any;
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip as any), { ssr: false }) as any;
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer as any), { ssr: false }) as any;
const ReferenceLine = dynamic(() => import("recharts").then((m) => m.ReferenceLine as any), { ssr: false }) as any;

const COLOR = "#F59E0B"; // warning
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
    <div className="rounded-lg border border-white/10 bg-[#121214] px-3 py-2 shadow-elevated">
      <p className="mb-1 text-[10px] uppercase tracking-wider font-semibold text-fg-subtle">{label} {label === '10+' ? 'Visits/mo' : 'Visits/mo'}</p>
      <p className="text-sm font-semibold text-fg num">{payload[0].value} customers</p>
    </div>
  );
});

interface Props { data?: { histogram: { bucket: string; customerCount: number }[]; median: number }; loading?: boolean; }

export const VisitFrequencyHistogram = memo(function VisitFrequencyHistogram({ data, loading }: Props) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label-xs mb-1">Visit Frequency</div>
          <p className="text-[11px] text-fg-subtle">Orders per month</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-48 sm:h-56 w-full" />
      ) : !data || data.histogram.length === 0 ? (
        <div className="relative h-48 sm:h-56 w-full flex items-center justify-center">
          <p className="text-[13px] text-fg-muted font-medium">No data available</p>
        </div>
      ) : (
        <div className="h-48 sm:h-56 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.histogram} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="customerCount" fill={COLOR} radius={[4, 4, 0, 0]} barSize={32} />
              {data.median > 0 && (
                <ReferenceLine 
                  x={data.median >= 10 ? '10+' : Math.round(data.median).toString()} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  label={{ position: 'top', value: 'Median', fill: '#ef4444', fontSize: 10 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});
