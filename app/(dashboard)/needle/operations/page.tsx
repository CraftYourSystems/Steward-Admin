import { DecisionCard, Decision } from "@/components/needle/DecisionCard";
import { Zap, AlertTriangle } from "lucide-react";

const mockOperationsDecisions: Decision[] = [
  {
    id: "dec_ops_1",
    tenantId: "t_1",
    observation: "Order #1042 wait time exceeded 18 minutes.",
    evidence: ["Table 4 | Order contains 2x Tandoori Platter (Time Taking Kitchen)."],
    impact: "Guest satisfaction risk. Kitchen station #1 bottleneck.",
    confidence: 98,
    recommendation: "Prioritize Station #1 tickets or send waiter update to Table 4.",
    action: {
      type: "NAVIGATE",
      label: "Open Kitchen Display",
      destinationUrl: "/kitchen"
    },
    sourceModule: "kds_monitor",
    urgency: "CRITICAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1800000).toISOString()
  },
  {
    id: "dec_ops_2",
    tenantId: "t_1",
    observation: "UPI QR Payment Gateway latency spike.",
    evidence: ["3 consecutive payment verification timeouts in the past 10 mins."],
    impact: "Customers experiencing payment delays at pay-at-counter.",
    confidence: 95,
    recommendation: "Switch primary gateway to fallback provider (Razorpay Webhook).",
    action: {
      type: "NAVIGATE",
      label: "Switch Gateway",
      destinationUrl: "/pay-at-counter"
    },
    sourceModule: "payment_monitor",
    urgency: "CRITICAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1800000).toISOString()
  }
];

export default function NeedleOperationsPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FF9F0A]" />
            <h1 className="text-xl font-semibold tracking-tight text-white">Live Service Operations</h1>
          </div>
          <p className="text-sm text-gray-400">Level 1 operational alerts requiring immediate intervention during shift.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {mockOperationsDecisions.map(decision => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}
