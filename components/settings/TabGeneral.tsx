"use client";
// restaurant-code section reads from auth store (not settings API — code is set by backend at registration)

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import {
  Copy, Check, ExternalLink, Download, QrCode, Link2, Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";
import { CURRENCIES, TIMEZONES } from "@/types/settings";

import { MENU_URL } from "@/lib/config/env";

function getMenuBaseUrl(): string {
  return MENU_URL.replace(/\/$/, "");
}

// ─── QR code URL ──────────────────────────────────────────────────────────────
// Uses qrserver.com — free, no API key, no npm package needed.

function qrImageUrl(data: string, size = 240): string {
  return (
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&margin=2`
  );
}

// ─── MenuQrSection ────────────────────────────────────────────────────────────

interface MenuQrSectionProps {
  slug?: string | null;
  restaurantName?: string;
}

function MenuQrSection({ slug, restaurantName }: MenuQrSectionProps) {
  const [linkCopied, setLinkCopied]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!slug) {
    return (
      <div className="rounded-xl border border-border bg-surface px-5 py-5">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="h-4 w-4 text-fg-subtle" />
          <span className="text-[13px] font-semibold text-fg">Menu link & QR code</span>
        </div>
        <p className="text-[12px] text-fg-subtle">
          Your menu link and QR code will appear here once your restaurant profile is saved.
        </p>
      </div>
    );
  }

  const menuUrl  = `${getMenuBaseUrl()}/menu/${slug}`;
  const qrUrl    = qrImageUrl(menuUrl, 240);
  const filename = `${slug}-menu-qr.png`;

  // ── Copy link ──────────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = menuUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // ── Download QR ────────────────────────────────────────────────────────────
  // Fetch as blob so the browser saves it as a file instead of opening it.
  const handleDownloadQr = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(qrUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(qrUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-5">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="h-4 w-4 text-fg-subtle" />
        <span className="text-[13px] font-semibold text-fg">Menu link & QR code</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">

        {/* ── QR image ── */}
        <div className="shrink-0 flex flex-col items-center gap-3">
          <img
            src={qrUrl}
            alt={`QR code for ${restaurantName ?? slug} menu`}
            width={140}
            height={140}
            className="rounded-lg border border-border bg-white p-2"
          />
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors disabled:opacity-50 w-full justify-center"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Downloading…" : "Download QR"}
          </button>
        </div>

        {/* ── Link + instructions ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          <p className="text-[12px] text-fg-subtle">
            Share this link or print the QR code — customers scan it to browse
            your menu and place orders directly from their phone.
          </p>

          {/* URL row */}
          <div>
            <div className="text-[11px] font-medium text-fg-subtle uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Your menu URL
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-md border border-border bg-surface-2 px-3 py-2">
                <span className="text-[12px] text-fg font-mono truncate block select-all">
                  {menuUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy link"
                className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors"
              >
                {linkCopied
                  ? <Check className="h-3.5 w-3.5 text-green-500" />
                  : <Copy className="h-3.5 w-3.5" />}
                {linkCopied ? "Copied!" : "Copy"}
              </button>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open menu in new tab"
                className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
            </div>
          </div>

          {/* Usage tips */}
          <div className="rounded-lg bg-surface-2 border border-border px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-medium text-fg">How to use</p>
            <ul className="text-[11px] text-fg-subtle space-y-0.5 list-disc list-inside">
              <li>Print the QR code and place it on tables or at the entrance</li>
              <li>Share the link on Instagram, WhatsApp, or Google Maps</li>
              <li>Customers scan → browse your menu → place order instantly</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── TabGeneral ─────────────────────────────────────────────────────────────--

import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { ImageUpload } from "./ImageUpload";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabGeneral({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  const { data: serverSettings } = useRestaurantSettings();

  const isDirty = (key: keyof RestaurantSettings) => {
    return serverSettings && serverSettings[key] !== settings[key];
  };

  const renderLabel = (label: string, keys: (keyof RestaurantSettings)[]) => {
    const dirty = keys.some(k => serverSettings && serverSettings[k] !== settings[k]);
    return (
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {dirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse animate-duration-1000" title="Unsaved change" />
        )}
      </div>
    );
  };

  const restaurant = useAuthStore((s) => s.restaurant);
  const restaurantCode = restaurant?.restaurantCode ?? null;
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!restaurantCode) return;
    try {
      await navigator.clipboard.writeText(restaurantCode);
    } catch {
      const el = document.createElement("textarea");
      el.value = restaurantCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="space-y-8">

      {/* ── 1. Restaurant Identity ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Restaurant Identity</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Configure your restaurant's public brand details, logo, and tagline.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow 
            label="Branding & Name" 
            description="Manage your brand logo, public restaurant name, and market tagline"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-24 shrink-0">
                <ImageUpload
                  value={settings.logoUrl}
                  onChange={(url) => set("logoUrl", url)}
                  type="logo"
                  label="Logo"
                  aspectRatio="aspect-square"
                />
              </div>
              <div className="flex-1 w-full space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                      Restaurant Name
                    </span>
                    {isDirty("name") && (
                      <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" title="Unsaved change" />
                    )}
                  </div>
                  <Input 
                    value={settings.name} 
                    onChange={(e) => set("name", e.target.value)} 
                    placeholder="e.g. My Restaurant" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                      Tagline
                    </span>
                    {isDirty("tagline") && (
                      <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" title="Unsaved change" />
                    )}
                  </div>
                  <Input 
                    value={settings.tagline} 
                    onChange={(e) => set("tagline", e.target.value)} 
                    placeholder="e.g. Authentic flavours since 2010" 
                  />
                </div>
              </div>
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── 2. Contact Information ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Contact Information</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Public contact details shown to customers on receipts and digital menus.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow label="Email address" description="For order confirmations and notification updates">
            <Input 
              type="email" 
              value={settings.email} 
              onChange={(e) => set("email", e.target.value)} 
              placeholder="restaurant@example.com" 
            />
          </SettingsRow>
          <SettingsRow label="Phone number" description="Customer-facing phone number">
            <Input 
              value={settings.phone} 
              onChange={(e) => set("phone", e.target.value)} 
              placeholder="+91 98765 43210" 
            />
          </SettingsRow>
          <SettingsRow label="Address" description="Physical address printed on receipts and delivery invoices">
            <textarea
              className="w-full min-h-[72px] rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle resize-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              value={settings.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="123 Main Street, Chennai, Tamil Nadu 600001"
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── 3. Regional Preferences ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Regional Preferences</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Set local regional standards for display prices and business schedules.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow label="Currency" description="Standard currency used for all menu prices and checkout totals">
            <Select value={settings.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
          <SettingsRow label="Timezone" description="Main timezone governing shifts, scheduler, and logs">
            <Select value={settings.timezone} onValueChange={(v) => set("timezone", v)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── 4. Menu & QR Access ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Menu & QR Access</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Public menu link, customer QR code print assets, and internal staff clock-in security code.
          </p>
        </div>

        {/* ── Staff security clock-in code ── */}
        <div className="rounded-xl border border-border bg-surface px-5 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-fg-subtle" />
            <span className="text-[13px] font-semibold text-fg">Restaurant code</span>
          </div>
          {restaurantCode ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-2.5">
                  <span className="text-[22px] font-bold font-mono tracking-[0.25em] text-fg select-all">
                    {restaurantCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copy code"
                    className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg hover:bg-surface-2 transition-colors"
                  >
                    {codeCopied
                      ? <Check className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                    {codeCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-fg-subtle max-w-xs">
                Share this code with your staff. They enter it on the Staff login tab together with their 4-digit PIN to clock in.
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-fg-subtle">
              Your restaurant code will appear here once your profile is saved.
            </p>
          )}
        </div>

        {/* ── Menu QR link and printable asset ── */}
        <MenuQrSection slug={settings.slug} restaurantName={settings.name} />
      </div>

    </div>
  );
}