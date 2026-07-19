"use client";

import { SettingsSection, SettingsRow } from "./SettingsShell";
import { ImageUpload } from "./ImageUpload";
import { ColorPicker } from "./ColorPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RestaurantSettings } from "@/types/settings";
import { GOOGLE_FONTS } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabBranding({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">

      {/* ── Brand Media Assets ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Brand Media Assets</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Upload custom restaurant logos and storefront header banners for receipts and digital menus.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow label="Logo" description="Square image, PNG or WebP recommended. Shown in sidebar navigation and receipts.">
            <div className="w-32">
              <ImageUpload
                value={settings.logoUrl}
                onChange={(url) => set("logoUrl", url)}
                type="logo"
                label="Logo"
                aspectRatio="aspect-square"
              />
            </div>
          </SettingsRow>
          <SettingsRow label="Banner" description="Wide banner image for customer-facing digital menu header. 3:1 ratio recommended.">
            <div className="max-w-sm">
              <ImageUpload
                value={settings.bannerUrl}
                onChange={(url) => set("bannerUrl", url)}
                type="banner"
                label="Banner"
                aspectRatio="aspect-[3/1]"
              />
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Brand Theme Palette & Typography ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Brand Palette & Typography</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Define primary accent colors and Google Fonts applied to digital customer touchpoints.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow label="Primary colour" description="Main brand colour used for call-to-action buttons and active states">
            <ColorPicker value={settings.primaryColor} onChange={(c) => set("primaryColor", c)} />
          </SettingsRow>
          <SettingsRow label="Accent colour" description="Secondary colour used for badges, category highlights, and indicators">
            <ColorPicker value={settings.accentColor} onChange={(c) => set("accentColor", c)} />
          </SettingsRow>
          <SettingsRow label="Font family" description="Applied to customer-facing menus, digital receipts, and online ordering">
            <Select value={settings.fontFamily} onValueChange={(v) => set("fontFamily", v)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOOGLE_FONTS.map((f) => (
                  <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Live Brand Preview Card ── */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="label-xs mb-3">Brand Identity Preview</div>
        <div
          className="rounded-lg overflow-hidden border border-border"
          style={{ fontFamily: settings.fontFamily }}
        >
          {settings.bannerUrl ? (
            <img src={settings.bannerUrl} alt="Banner" className="w-full h-24 object-cover" />
          ) : (
            <div className="h-24 flex items-center justify-center" style={{ background: settings.primaryColor + "22" }}>
              <span className="text-[12px]" style={{ color: settings.primaryColor }}>Banner Area Preview</span>
            </div>
          )}
          <div className="p-4 bg-surface">
            <div className="flex items-center gap-3 mb-3">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border" style={{ background: settings.primaryColor }}>
                  <span className="text-white text-[13px] font-bold">{(settings.name || "R")[0]}</span>
                </div>
              )}
              <div>
                <div className="text-[14px] font-semibold text-fg">{settings.name || "Restaurant Name"}</div>
                <div className="text-[11px] text-fg-subtle">{settings.tagline || "Your tagline here"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white" style={{ background: settings.primaryColor }}>
                Dine-in
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white" style={{ background: settings.accentColor }}>
                Takeaway
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
