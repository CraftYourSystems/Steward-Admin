"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSection, SettingsRow, SystemOverviewCard } from "./SettingsShell";
import type { RestaurantSettings, DayOfWeek } from "@/types/settings";
import { DAY_LABELS } from "@/types/settings";
import { cn } from "@/lib/utils";
import { ChevronRight, Activity, Clock, DollarSign, Utensils } from "lucide-react";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

const DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function TabOperations({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  const patchHours = (day: DayOfWeek, patch: Partial<typeof settings.openingHours[DayOfWeek]>) => {
    onChange({
      openingHours: {
        ...settings.openingHours,
        [day]: { ...settings.openingHours[day], ...patch },
      },
    });
  };

  return (
    <div className="space-y-6">

      {/* ── Operational Readiness Overview Card ── */}
      <SystemOverviewCard
        title="Kitchen & Service Operations Readiness"
        description="Current operational status, order reception automation, and kitchen prep parameters."
        icon={<Activity className="h-4 w-4 text-accent" />}
        statusBadge={{
          text: settings.offlineMode ? "Offline" : "Receiving Orders",
          variant: settings.offlineMode ? "warning" : "success",
        }}
        items={[
          { label: "Order Acceptance", value: settings.autoAcceptOrders ? "Auto-Confirmed" : "Manual Approval", icon: <Activity className="h-3 w-3" /> },
          { label: "Est. Preparation", value: `${settings.estimatedPrepMins || 20} mins`, icon: <Clock className="h-3 w-3" /> },
          { label: "Tax & Service", value: `GST ${settings.taxRate}% • Service ${settings.serviceCharge}%`, icon: <DollarSign className="h-3 w-3" /> },
        ]}
      />

      {/* ── Pricing & Tax Rules ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Pricing, Taxes & Charges</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Configure GST tax rates, service charges, and receipt line items applied to customer orders.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow label="Tax rate (%)" description="Standard statutory tax applied to all orders (e.g. GST)">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="w-24"
                value={settings.taxRate}
                onChange={(e) => set("taxRate", parseFloat(e.target.value) || 0)}
              />
              <span className="text-[12px] text-fg-subtle">%</span>
            </div>
          </SettingsRow>
          <SettingsRow label="Service charge (%)" description="Optional service charge added to dine-in bill">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="w-24"
                value={settings.serviceCharge}
                onChange={(e) => set("serviceCharge", parseFloat(e.target.value) || 0)}
              />
              <span className="text-[12px] text-fg-subtle">%</span>
            </div>
          </SettingsRow>
          <SettingsRow label="Service charge label" description="Printed label shown on receipt line item">
            <Input
              className="w-48"
              value={settings.serviceChargeLabel}
              onChange={(e) => set("serviceChargeLabel", e.target.value)}
              placeholder="Service Charge"
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Kitchen Prep & Batch Limits ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Kitchen Prep & Batch Limits</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Set default prep estimation and batch capacity rules for high-volume kitchen counters.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow label="Auto-accept orders" description="Automatically move incoming orders to Confirmed state without manual kitchen approval">
            <Switch checked={settings.autoAcceptOrders} onCheckedChange={(v) => set("autoAcceptOrders", v)} />
          </SettingsRow>
          <SettingsRow label="Default prep time" description="Estimated preparation time shown to customers on checkout (minutes)">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={120}
                className="w-24"
                value={settings.estimatedPrepMins}
                onChange={(e) => set("estimatedPrepMins", parseInt(e.target.value) || 20)}
              />
              <span className="text-[12px] text-fg-subtle">min</span>
            </div>
          </SettingsRow>
          <SettingsRow
            label="Max dosas per batch"
            description="Maximum item quantity in the 'Current' section of the Dosa Counter. Overflow orders automatically flow to 'Upcoming'."
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                className="w-24"
                value={settings.maxDosaCount ?? 8}
                onChange={(e) => set("maxDosaCount", parseInt(e.target.value) || 8)}
              />
              <span className="text-[12px] text-fg-subtle">dosas</span>
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Offline Mode ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Store Storefront Availability</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Temporarily pause incoming digital orders during extreme rushes or emergencies.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow label="Offline mode" description="Pause all incoming customer orders and show a custom message on digital menu">
            <Switch
              checked={settings.offlineMode}
              onCheckedChange={(v) => set("offlineMode", v)}
            />
          </SettingsRow>
          {settings.offlineMode && (
            <SettingsRow label="Offline message" description="Notice displayed to customers when accessing digital menu">
              <Input
                value={settings.offlineModeMessage}
                onChange={(e) => set("offlineModeMessage", e.target.value)}
                placeholder="We're currently closed. Please check back later."
              />
            </SettingsRow>
          )}
        </SettingsSection>
      </div>

      {/* ── Opening Hours ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Operating Hours</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Define weekly opening and closing hours for customer ordering.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {DAYS.map((day, i) => {
            const h = settings.openingHours[day];
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3",
                  i < DAYS.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-24 shrink-0">
                  <span className={cn("text-[13px] font-medium", h.closed ? "text-fg-subtle" : "text-fg")}>
                    {DAY_LABELS[day]}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  {h.closed ? (
                    <span className="text-[12px] text-fg-subtle italic">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => patchHours(day, { open: e.target.value })}
                        className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                      />
                      <span className="text-[11px] text-fg-subtle">to</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => patchHours(day, { close: e.target.value })}
                        className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                      />
                    </div>
                  )}
                </div>
                <Switch
                  checked={!h.closed}
                  onCheckedChange={(v) => patchHours(day, { closed: !v })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Shifts Link ── */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-[13px] font-semibold text-fg">Shift Roster Management</h4>
            <p className="text-[11px] text-fg-subtle">Weekly staff shifts for kitchen throughput tracking.</p>
          </div>
          <a
            href="/settings?tab=shifts"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Manage shifts <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </div>

    </div>
  );
}
