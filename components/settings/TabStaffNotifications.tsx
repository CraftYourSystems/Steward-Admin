"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSection, SettingsRow, SystemOverviewCard } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";
import { Bell, Volume2, Mail, ShieldCheck } from "lucide-react";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabStaffNotifications({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">

      {/* ── Notification Channels System Overview Card ── */}
      <SystemOverviewCard
        title="Team Alert Dispatch & Audio Channels"
        description="Active staff notification channels for real-time kitchen order dispatch and stock warnings."
        icon={<Bell className="h-4 w-4 text-accent" />}
        statusBadge={{
          text: settings.notifyOnNewOrder ? "Alerts Active" : "Silent Mode",
          variant: settings.notifyOnNewOrder ? "success" : "neutral",
        }}
        items={[
          { label: "New Order Sound", value: settings.notifyOnNewOrder ? "Audio Chime Active" : "Muted", icon: <Volume2 className="h-3 w-3" /> },
          { label: "Low Stock Alerts", value: settings.notifyOnLowStock ? "Monitoring On" : "Disabled", icon: <Bell className="h-3 w-3" /> },
          { label: "Manager Digest", value: settings.notifyEmail ? settings.notifyEmail : "Unconfigured", icon: <Mail className="h-3 w-3" /> },
        ]}
      />

      {/* ── Notification Rules ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Team Alert Triggers</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Configure sound chimes, dashboard toasts, and daily digest emails sent to staff.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="New order alerts"
            description="Play an audible chime and trigger an instant toast notification when a new order arrives"
          >
            <Switch
              checked={settings.notifyOnNewOrder}
              onCheckedChange={(v) => set("notifyOnNewOrder", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Low stock alerts"
            description="Notify staff when menu item availability is toggled off frequently on the kitchen board"
          >
            <Switch
              checked={settings.notifyOnLowStock}
              onCheckedChange={(v) => set("notifyOnLowStock", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Notification email"
            description="Manager email address for daily closing summaries and critical system alerts"
          >
            <Input
              type="email"
              className="max-w-xs"
              value={settings.notifyEmail}
              onChange={(e) => set("notifyEmail", e.target.value)}
              placeholder="manager@restaurant.com"
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Active Channel Indicators ── */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="label-xs mb-3">Notification Delivery Channels</div>
        <div className="space-y-3">
          {[
            { icon: Bell, label: "In-app Dashboard Toasts", desc: "Real-time toast notifications across all Steward windows", enabled: true },
            { icon: Volume2, label: "Kitchen Board Audio Chime", desc: "High-audibility chime on new incoming tickets", enabled: settings.notifyOnNewOrder },
            { icon: Mail, label: "Daily Email Digest", desc: settings.notifyEmail ? `Sent daily to ${settings.notifyEmail}` : "No email address configured", enabled: !!settings.notifyEmail },
          ].map(({ icon: Icon, label, desc, enabled }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${enabled ? "border-accent/30 bg-accent/10" : "border-border bg-surface-3"}`}>
                <Icon className={`h-3.5 w-3.5 ${enabled ? "text-accent" : "text-fg-subtle"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-fg">{label}</div>
                <div className="text-[11px] text-fg-subtle truncate">{desc}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${enabled ? "bg-success/15 text-success border border-success/20" : "bg-surface-3 text-fg-subtle border border-white/5"}`}>
                {enabled ? "Active" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
