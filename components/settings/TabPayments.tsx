"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsRow, SystemOverviewCard } from "./SettingsShell";
import { PaymentGateways } from "./PaymentGateways";
import type { RestaurantSettings } from "@/types/settings";
import { CreditCard, ShieldCheck, Receipt, QrCode } from "lucide-react";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabPayments({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  const acceptedMethodsText = [
    settings.acceptsUpi && "UPI",
    settings.acceptsCard && "Card",
    settings.acceptsCash && "Cash",
    settings.acceptsOnline && "Online Gateway",
  ].filter(Boolean).join(" • ") || "None Enabled";

  return (
    <div className="space-y-6">

      {/* ── Payments System Overview Card ── */}
      <SystemOverviewCard
        title="Payment Channels & Gateway Readiness"
        description="Active customer payment methods, gateway integration status, and legal tax compliance."
        icon={<CreditCard className="h-4 w-4 text-accent" />}
        statusBadge={{
          text: settings.acceptsOnline ? "Gateway Connected" : "Direct Payments",
          variant: settings.acceptsOnline ? "success" : "info",
        }}
        items={[
          { label: "Gateway Status", value: settings.acceptsOnline ? "Razorpay Online Active" : "Counter Payments Only", icon: <CreditCard className="h-3 w-3" /> },
          { label: "Accepted Channels", value: acceptedMethodsText, icon: <QrCode className="h-3 w-3" /> },
          { label: "GST Registration", value: settings.gstin ? settings.gstin : "Unconfigured", icon: <ShieldCheck className="h-3 w-3" /> },
        ]}
      />

      {/* ── Accepted payment methods ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Accepted Payment Methods</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Configure payment options offered to customers at counter, table checkout, and online ordering.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="Cash"
            description="Accept cash payments at the counter"
          >
            <Switch
              checked={settings.acceptsCash}
              onCheckedChange={(v) => set("acceptsCash", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Card (POS)"
            description="Accept debit / credit card via your POS machine"
          >
            <Switch
              checked={settings.acceptsCard}
              onCheckedChange={(v) => set("acceptsCard", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="UPI"
            description="Accept UPI payments (PhonePe, Google Pay, Paytm, BHIM)"
          >
            <Switch
              checked={settings.acceptsUpi}
              onCheckedChange={(v) => set("acceptsUpi", v)}
            />
          </SettingsRow>
          {settings.acceptsUpi && (
            <SettingsRow
              label="UPI ID"
              description="Displayed to customers at checkout so they can scan or pay directly"
            >
              <Input
                className="max-w-xs"
                value={settings.upiId}
                onChange={(e) => set("upiId", e.target.value)}
                placeholder="yourname@upi"
              />
            </SettingsRow>
          )}
          <SettingsRow
            label="Online payments"
            description="Accept payments via payment gateway (requires gateway integration)"
          >
            <Switch
              checked={settings.acceptsOnline}
              onCheckedChange={(v) => set("acceptsOnline", v)}
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      {settings.acceptsOnline && (
        <div className="pt-2">
           <PaymentGateways />
        </div>
      )}

      {/* ── Statutory & Tax IDs ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Statutory & Tax Compliance</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Mandatory government registration numbers printed on customer receipts and invoice records.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="GSTIN"
            description="Your 15-digit Goods and Services Tax Identification Number — printed on every receipt"
          >
            <Input
              className="max-w-xs"
              value={settings.gstin}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
            />
          </SettingsRow>
          <SettingsRow
            label="FSSAI licence number"
            description="Food safety licence number — printed on receipts and digital menu footer"
          >
            <Input
              className="max-w-xs"
              value={settings.fssaiNumber}
              onChange={(e) => set("fssaiNumber", e.target.value)}
              placeholder="10000000000000"
              maxLength={14}
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* ── Receipt Formatting ── */}
      <div className="space-y-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-fg tracking-tight">Receipt Formatting & Rules</h3>
          <p className="text-[11px] text-fg-subtle mt-0.5">
            Customize printed receipt footer notes and itemized tax display options.
          </p>
        </div>
        <SettingsSection>
          <SettingsRow
            label="Receipt footer"
            description="Custom thank-you message printed at the bottom of every customer receipt"
          >
            <Input
              value={settings.receiptFooter}
              onChange={(e) => set("receiptFooter", e.target.value)}
              placeholder="Thank you for dining with us!"
            />
          </SettingsRow>
          <SettingsRow
            label="Show tax breakdown"
            description="Show CGST / SGST / IGST line items on receipt. Turn off to show only the total tax amount."
          >
            <Switch
              checked={settings.showTaxBreakdown}
              onCheckedChange={(v) => set("showTaxBreakdown", v)}
            />
          </SettingsRow>
        </SettingsSection>
      </div>

    </div>
  );
}
