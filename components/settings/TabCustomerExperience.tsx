"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabCustomerExperience({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">

      {/* ── Post-order Messaging ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Post-Order Messaging & Feedback</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Customize confirmation notices and post-meal customer feedback collection.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="Thank-you message"
            description="Message displayed to the customer on screen immediately after placing an order"
          >
            <Input
              value={settings.thankYouMessage}
              onChange={(e) => set("thankYouMessage", e.target.value)}
              placeholder="Your order has been placed! We'll have it ready soon."
            />
          </SettingsRow>
          <SettingsRow
            label="Enable customer feedback"
            description="Prompt customers to rate their food and service experience after order completion"
          >
            <Switch
              checked={settings.enableFeedback}
              onCheckedChange={(v) => set("enableFeedback", v)}
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Contact & Social Channels ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Contact & Social Channels</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Public WhatsApp support numbers, location links, and social handles displayed on digital menu.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="WhatsApp support number"
            description="Customers tap this to message your staff directly for assistance. Include country code — e.g. +91 98765 43210"
          >
            <Input
              className="max-w-xs"
              value={settings.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </SettingsRow>
          <SettingsRow
            label="Google Maps link"
            description="Direct link to your restaurant location on Google Maps — shown on customer menu footer"
          >
            <Input
              className="max-w-sm"
              value={settings.googleMapsUrl}
              onChange={(e) => set("googleMapsUrl", e.target.value)}
              placeholder="https://maps.google.com/?q=..."
            />
          </SettingsRow>
          <SettingsRow
            label="Instagram handle"
            description="Your Instagram handle without @ symbol. Displayed as a social link on the digital menu footer."
          >
            <div className="flex items-center gap-1.5 max-w-xs">
              <span className="text-[13px] text-fg-muted shrink-0">@</span>
              <Input
                value={settings.instagramHandle}
                onChange={(e) => set("instagramHandle", e.target.value.replace("@", ""))}
                placeholder="yourrestaurant"
              />
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>

    </div>
  );
}
