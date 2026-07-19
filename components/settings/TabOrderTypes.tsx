"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsRow, SystemOverviewCard } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";
import { ShoppingBag, Utensils, Truck, Layers } from "lucide-react";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabOrderTypes({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  const activeChannelsText = [
    settings.dineInEnabled && "Dine-in",
    settings.takeawayEnabled && "Takeaway",
    settings.deliveryEnabled && "Delivery",
  ].filter(Boolean).join(" • ") || "None Enabled";

  return (
    <div className="space-y-6">

      {/* ── Ordering Channels Overview Card ── */}
      <SystemOverviewCard
        title="Ordering Channels & Table Rules"
        description="Active fulfillment channels and table ordering limits for digital customers."
        icon={<ShoppingBag className="h-4 w-4 text-accent" />}
        statusBadge={{
          text: activeChannelsText,
          variant: "success",
        }}
        items={[
          { label: "Active Fulfillment", value: activeChannelsText, icon: <Layers className="h-3 w-3" /> },
          { label: "Dine-In Capacity", value: settings.dineInEnabled ? `${settings.tableCount} ${settings.tablePrefix || "Table"}s` : "Disabled", icon: <Utensils className="h-3 w-3" /> },
          { label: "Min Order Value", value: settings.minimumOrderAmount ? `₹${settings.minimumOrderAmount}` : "No Minimum", icon: <ShoppingBag className="h-3 w-3" /> },
        ]}
      />

      {/* ── Order Channels Configuration ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Fulfillment Channels</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Enable or disable customer ordering options across Dine-in, Takeaway, and Delivery.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="Dine-in"
            description="Customers order directly from their table using a table QR code"
          >
            <Switch
              checked={settings.dineInEnabled}
              onCheckedChange={(v) => set("dineInEnabled", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Takeaway"
            description="Customers order ahead online and pick up at the main counter"
          >
            <Switch
              checked={settings.takeawayEnabled}
              onCheckedChange={(v) => set("takeawayEnabled", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Delivery"
            description="Customers order for home delivery (fulfilled via your internal delivery staff)"
          >
            <Switch
              checked={settings.deliveryEnabled}
              onCheckedChange={(v) => set("deliveryEnabled", v)}
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Table Layout Configuration — only shown when dine-in is on ── */}
      {settings.dineInEnabled && (
        <div className="space-y-2.5">
          <div>
            <h3 className="text-[14px] font-semibold text-fg tracking-tight">Dine-in Table Configuration</h3>
            <p className="text-[11px] text-fg-subtle mt-0.5">
              Set total table count and custom table labelling for digital QR ordering.
            </p>
          </div>
          <SettingsSection>
            <SettingsRow
              label="Number of tables"
              description="Total physical tables in your dining area available for customer self-ordering"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={500}
                  className="w-24"
                  value={settings.tableCount}
                  onChange={(e) => set("tableCount", parseInt(e.target.value) || 1)}
                />
                <span className="text-[12px] text-fg-subtle">tables</span>
              </div>
            </SettingsRow>
            <SettingsRow
              label="Table label"
              description={`How tables are displayed to customers — e.g. "${settings.tablePrefix} 4" or "Room 4"`}
            >
              <Input
                className="w-36"
                value={settings.tablePrefix}
                onChange={(e) => set("tablePrefix", e.target.value)}
                placeholder="Table"
              />
            </SettingsRow>
          </SettingsSection>
        </div>
      )}

      {/* ── Order Rules ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Order Checkout Rules</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Configure minimum order amounts and customer special instruction permissions.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="Minimum order amount"
            description="Orders below this total will be blocked at checkout. Set to 0 for no minimum."
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-fg-muted">₹</span>
              <Input
                type="number"
                min={0}
                step={10}
                className="w-28"
                value={settings.minimumOrderAmount}
                onChange={(e) => set("minimumOrderAmount", parseFloat(e.target.value) || 0)}
              />
            </div>
          </SettingsRow>
          <SettingsRow
            label="Allow order notes"
            description="Let customers add custom preparation requests or allergy notes to their order"
          >
            <Switch
              checked={settings.allowOrderNotes}
              onCheckedChange={(v) => set("allowOrderNotes", v)}
            />
          </SettingsRow>
        </SettingsSection>
      </div>

    </div>
  );
}
