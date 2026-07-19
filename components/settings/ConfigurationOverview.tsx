"use client";

import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, Building2, CreditCard, QrCode, Users, Globe, Store } from "lucide-react";
import type { RestaurantSettings } from "@/types/settings";

interface ConfigurationOverviewProps {
  settings: RestaurantSettings | null;
  branchName?: string;
  activeQrCount?: number;
}

export function ConfigurationOverview({ settings, branchName, activeQrCount = 1 }: ConfigurationOverviewProps) {
  const setupItems = useMemo(() => {
    if (!settings) return [];
    
    const hasName = Boolean(settings.name && settings.name.trim().length > 0);
    const hasPayments = Boolean(settings.acceptsCash || settings.acceptsCard || settings.acceptsUpi || settings.acceptsOnline);
    const hasQr = Boolean(settings.dineInEnabled || settings.takeawayEnabled);
    const hasGst = Boolean(settings.gstin && settings.gstin.trim().length > 0);
    const hasTimezone = Boolean(settings.timezone);

    return [
      { id: "identity", label: "Restaurant Identity", done: hasName },
      { id: "payments", label: "Payments", done: hasPayments },
      { id: "qr", label: "QR Ordering", done: hasQr },
      { id: "gst", label: "GST Compliance", done: hasGst, isWarning: !hasGst },
      { id: "timezone", label: "Timezone", done: hasTimezone },
    ];
  }, [settings]);

  const completionPercentage = useMemo(() => {
    if (setupItems.length === 0) return 0;
    const completed = setupItems.filter(i => i.done).length;
    return Math.round((completed / setupItems.length) * 100);
  }, [setupItems]);

  const acceptedPaymentMethods = useMemo(() => {
    if (!settings) return "Unconfigured";
    const methods: string[] = [];
    if (settings.acceptsUpi) methods.push("UPI");
    if (settings.acceptsCard) methods.push("Card");
    if (settings.acceptsCash) methods.push("Cash");
    if (settings.acceptsOnline) methods.push("Online");
    return methods.length > 0 ? methods.join(" • ") : "None enabled";
  }, [settings]);

  if (!settings) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-surface/90 p-5 shadow-sm space-y-4">
      {/* ── Top Header Anchor & Setup Status Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
              Restaurant Configuration Center
            </span>
          </div>
          <h3 className="text-base font-semibold text-fg tracking-tight">Restaurant Configuration</h3>
          <p className="text-[12px] text-fg-subtle mt-0.5">
            Review and manage how your restaurant is configured across Steward.
          </p>
        </div>

        {/* ── Setup Status Progress Pill ── */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 bg-surface-2/80 border border-border px-4 py-2.5 rounded-xl">
          <div>
            <div className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider">Restaurant Setup</div>
            <div className="text-[13px] font-bold text-fg">{completionPercentage}% Complete</div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 sm:pl-3">
            {setupItems.map((item) => (
              <span
                key={item.id}
                title={item.done ? `${item.label} Configured` : `${item.label} Needs Attention`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                  item.done
                    ? "bg-success/10 text-success border-success/20"
                    : item.isWarning
                    ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-white/5 text-fg-subtle border-white/5"
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : item.isWarning ? (
                  <AlertTriangle className="h-3 w-3 text-warning" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-fg-subtle" />
                )}
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Operational Overview Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Restaurant */}
        <div className="rounded-xl border border-border/60 bg-surface-2/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-fg-subtle mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Restaurant</span>
            <Store className="h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-fg truncate">{settings.name || "Configured"}</div>
            <div className="text-[10px] text-success font-medium flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Configured
            </div>
          </div>
        </div>

        {/* Card 2: Branches */}
        <div className="rounded-xl border border-border/60 bg-surface-2/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-fg-subtle mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Branches</span>
            <Building2 className="h-3.5 w-3.5 text-fg-subtle" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-fg truncate">{branchName || "Main Branch"}</div>
            <div className="text-[10px] text-fg-subtle font-medium mt-0.5">1 Active Location</div>
          </div>
        </div>

        {/* Card 3: Payments */}
        <div className="rounded-xl border border-border/60 bg-surface-2/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-fg-subtle mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Payments</span>
            <CreditCard className="h-3.5 w-3.5 text-fg-subtle" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-fg truncate">
              {settings.acceptsOnline ? "Gateway Connected" : "Direct Payments"}
            </div>
            <div className="text-[10px] text-fg-subtle font-medium truncate mt-0.5" title={acceptedPaymentMethods}>
              {acceptedPaymentMethods}
            </div>
          </div>
        </div>

        {/* Card 4: QR Ordering */}
        <div className="rounded-xl border border-border/60 bg-surface-2/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-fg-subtle mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">QR Ordering</span>
            <QrCode className="h-3.5 w-3.5 text-fg-subtle" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-fg truncate">
              {settings.dineInEnabled ? "Enabled" : "Takeaway Only"}
            </div>
            <div className="text-[10px] text-fg-subtle font-medium mt-0.5">
              {activeQrCount} Active {activeQrCount === 1 ? "QR Code" : "QR Codes"}
            </div>
          </div>
        </div>

        {/* Card 5: Team */}
        <div className="rounded-xl border border-border/60 bg-surface-2/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-fg-subtle mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Team</span>
            <Users className="h-3.5 w-3.5 text-fg-subtle" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-fg truncate">Staff Access</div>
            <div className="text-[10px] text-fg-subtle font-medium mt-0.5">PIN & Roles Enabled</div>
          </div>
        </div>

        {/* Card 6: Timezone */}
        <div className="rounded-xl border border-border/60 bg-surface-2/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-fg-subtle mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Timezone</span>
            <Globe className="h-3.5 w-3.5 text-fg-subtle" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-fg truncate">{settings.timezone || "Asia/Kolkata"}</div>
            <div className="text-[10px] text-fg-subtle font-medium mt-0.5">Regional Currency {settings.currency || "INR"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
