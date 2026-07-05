"use client";

import React from "react";
import { useEmployeeEfficiency, useOrderAccuracy, useScheduleAdherence } from "@/hooks/useStaffAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffAnalyticsPage() {
  const efficiency = useEmployeeEfficiency();
  const accuracy = useOrderAccuracy();
  const adherence = useScheduleAdherence();

  const isLoading = efficiency.isLoading || accuracy.isLoading || adherence.isLoading;

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <div className="label-xs mb-1">Analytics</div>
        <h2 className="text-xl font-semibold tracking-tight text-fg">Staff Analytics</h2>
        <p className="text-[12px] text-fg-subtle mt-1">Employee Efficiency & Schedule Adherence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Efficiency */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <Activity className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Efficiency</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[100px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="space-y-3">
              {efficiency.data?.map((staff: any) => (
                <div key={staff.userId} className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-fg">{staff.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-semibold text-fg num">{staff.ordersPerHour}</span>
                      <span className="text-[10px] text-fg-muted uppercase">ord/hr</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-fg-subtle mt-2">
                    <span>{staff.totalHours} hrs • {staff.totalOrders} total</span>
                    <span className="truncate max-w-[120px] text-right">Stations: {staff.stationsCovered}</span>
                  </div>
                </div>
              ))}
              {efficiency.data?.length === 0 && <p className="text-sm text-fg-muted italic">No efficiency data.</p>}
            </div>
          )}
        </div>

        {/* Order Accuracy */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <CheckCircle className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Order Accuracy</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[100px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="space-y-3">
              {accuracy.data?.map((staff: any) => (
                <div key={staff.userId} className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-fg">{staff.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-semibold text-success num">{staff.accuracyRate}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-fg-subtle mt-2">
                    <span>{staff.totalOrders} orders</span>
                    <span>{staff.correctedOrders} corrections</span>
                  </div>
                </div>
              ))}
              {accuracy.data?.length === 0 && <p className="text-sm text-fg-muted italic">No accuracy data.</p>}
            </div>
          )}
        </div>

        {/* Schedule Adherence */}
        <div className="card-premium p-4 space-y-4">
          <div className="flex items-center gap-2 text-fg-subtle">
            <Clock className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold uppercase tracking-wider">Schedule Adherence</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-[100px] w-full bg-surface-2 rounded-lg" />
          ) : (
            <div className="space-y-3">
              {adherence.data?.map((staff: any) => (
                <div key={staff.id} className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-fg">{staff.name}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      staff.isLate ? "bg-danger/20 text-danger border border-danger/30" : "bg-success/20 text-success border border-success/30"
                    )}>
                      {staff.isLate ? `${staff.minutesLate}m LATE` : "ON TIME"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-fg-subtle mt-2">
                    <span>Sched: {staff.shiftStart || "N/A"}</span>
                    <span>In: {new Date(staff.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
              {adherence.data?.length === 0 && <p className="text-sm text-fg-muted italic">No schedule data.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}