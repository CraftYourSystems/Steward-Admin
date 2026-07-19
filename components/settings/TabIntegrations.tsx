"use client";

import { SettingsShell } from "./SettingsShell";
import { CheckCircle2, ArrowUpRight, Zap, ShieldCheck } from "lucide-react";

interface IntegrationItem {
  name: string;
  category: string;
  description: string;
  status: "Supported Native" | "Connector Planned" | "API Ready";
  capabilities: string[];
  iconBg: string;
  iconText: string;
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    name: "Razorpay",
    category: "Payment Gateway",
    description: "Instant UPI, card, and netbanking payment settlement directly to your restaurant bank account.",
    status: "Supported Native",
    capabilities: ["Automated UPI QR Generation", "Refund Processing", "Instant Settlement Sync"],
    iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    iconText: "RZP",
  },
  {
    name: "WhatsApp Business API",
    category: "Customer Messaging",
    description: "Automated order receipts, live preparation status alerts, and feedback collection via WhatsApp.",
    status: "Supported Native",
    capabilities: ["Automated Order Status Updates", "Customer Receipt Delivery", "Direct Chat Support"],
    iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    iconText: "WA",
  },
  {
    name: "Swiggy Direct Ingestion",
    category: "Delivery Platform",
    description: "Consolidate online Swiggy delivery orders straight to the Steward KDS without dual entry.",
    status: "Connector Planned",
    capabilities: ["Order Auto-Acceptance", "Menu Availability Sync", "Preparation Time Dispatch"],
    iconBg: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    iconText: "SWG",
  },
  {
    name: "Zomato Direct Ingestion",
    category: "Delivery Platform",
    description: "Real-time kitchen ticket printing and order status sync for Zomato marketplace orders.",
    status: "Connector Planned",
    capabilities: ["Live KDS Ticket Dispatch", "8-Second Auto Confirm", "Item Out-of-Stock Toggle"],
    iconBg: "bg-red-500/15 text-red-400 border-red-500/20",
    iconText: "ZMT",
  },
  {
    name: "ONDC Network Connector",
    category: "Open Commerce",
    description: "Expose your digital menu on the Open Network for Digital Commerce without high marketplace commissions.",
    status: "Connector Planned",
    capabilities: ["Open Network Catalog Publishing", "Zero-Commission Orders", "Universal Courier Handshake"],
    iconBg: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    iconText: "ONDC",
  },
  {
    name: "Tally Prime Accounting",
    category: "Accounting & GST",
    description: "Export daily sales summaries, itemized GST tax logs, and inventory ledger vouchers directly into Tally.",
    status: "API Ready",
    capabilities: ["Daily Closing Voucher Sync", "GSTR-1 Itemized Tax Export", "Inventory Consumption Sync"],
    iconBg: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    iconText: "TLY",
  },
];

export function TabIntegrations() {
  return (
    <div className="space-y-6">
      <SettingsShell
        title="Integrations & Connectors"
        description="Steward is designed to connect seamlessly with the tools and platforms your restaurant relies on every day."
      >
        {/* ── ROS Ecosystem Banner ── */}
        <div className="rounded-xl border border-border bg-gradient-to-r from-surface to-surface-2 p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-[13px] font-semibold text-fg">Native Ecosystem Architecture</span>
          </div>
          <p className="text-[12px] text-fg-subtle leading-relaxed max-w-2xl">
            Settings configures behavior across all connected platforms. Steward acts as your central Restaurant Operating System, ensuring order data, menu stock, tax ledgering, and payment settlements remain perfectly unified.
          </p>
        </div>

        {/* ── Integration Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-border bg-surface p-5 flex flex-col justify-between hover:border-border-strong transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg border flex items-center justify-center font-mono font-bold text-[13px] shrink-0 ${item.iconBg}`}>
                      {item.iconText}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-fg tracking-tight">{item.name}</h4>
                      <span className="text-[11px] text-fg-subtle">{item.category}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      item.status === "Supported Native"
                        ? "bg-success/15 text-success border-success/20"
                        : item.status === "Connector Planned"
                        ? "bg-accent/15 text-accent border-accent/20"
                        : "bg-white/10 text-fg-muted border-white/10"
                    }`}
                  >
                    {item.status === "Supported Native" && <CheckCircle2 className="h-3 w-3" />}
                    {item.status}
                  </span>
                </div>

                <p className="text-[12px] text-fg-subtle leading-relaxed mb-4">
                  {item.description}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-border/60">
                  <div className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider flex items-center gap-1 mb-1">
                    <ShieldCheck className="h-3 w-3 text-fg-subtle" />
                    Capabilities
                  </div>
                  {item.capabilities.map((cap) => (
                    <div key={cap} className="flex items-center gap-2 text-[11px] text-fg font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {cap}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-fg-subtle font-mono">Integration ID: {item.name.toLowerCase().replace(/\s+/g, "-")}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Configure Connector <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SettingsShell>
    </div>
  );
}
