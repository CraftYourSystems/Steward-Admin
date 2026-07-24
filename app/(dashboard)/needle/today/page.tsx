import { DecisionCard, Decision } from "@/components/needle/DecisionCard";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

const mockTodayDecisions: Decision[] = [
  {
    id: "dec_1",
    tenantId: "t_1",
    observation: "Kitchen thermal printer is disconnected.",
    evidence: ["No heartbeat signal received from Station #2 (Grill) in the last 15 minutes."],
    impact: "Orders sent to Grill station will fail to print tickets.",
    confidence: 99,
    recommendation: "Check power & Ethernet cable on Grill printer or restart unit.",
    action: {
      type: "NAVIGATE",
      label: "Troubleshoot Printer",
      destinationUrl: "/settings?tab=hardware"
    },
    sourceModule: "hardware_monitor",
    urgency: "CRITICAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: "dec_2",
    tenantId: "t_1",
    observation: "Tomatoes inventory reaching daily threshold.",
    evidence: ["Current stock: 4.2 kg. Expected lunch usage: 8.5 kg."],
    impact: "Risk of 86-ing Pasta & Salsa items during lunch peak.",
    confidence: 92,
    recommendation: "Approve quick restock from secondary vendor or local market.",
    action: {
      type: "NAVIGATE",
      label: "Approve Restock",
      destinationUrl: "/inventory"
    },
    sourceModule: "inventory_monitor",
    urgency: "HIGH",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: "dec_3",
    tenantId: "t_1",
    observation: "Dosa Batter prep recommendation for lunch rush.",
    evidence: ["Rain forecasted for 1:00 PM (+35% increase in hot breakfast/tiffin items)."],
    impact: "Avoid 15-minute kitchen bottleneck during 1:00 PM peak.",
    confidence: 89,
    recommendation: "Prepare 10 additional batches of batter before 11:30 AM.",
    action: {
      type: "NAVIGATE",
      label: "Open Prep Sheet",
      destinationUrl: "/inventory?tab=prep"
    },
    sourceModule: "prep_planner",
    urgency: "MEDIUM",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  }
];

export default function NeedleTodayPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Morning Readiness Summary Banner */}
      <div className="border border-white/10 bg-[#0D0D0D] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[#32D74B]/10 text-[#32D74B] border border-[#32D74B]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Restaurant Operational Status</h2>
              <span className="bg-[#32D74B]/15 text-[#32D74B] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#32D74B]/30">
                96% Ready
              </span>
            </div>
            <p className="text-sm text-gray-400">Can I operate today? <span className="text-white font-medium">Yes. 1 critical hardware issue, 2 low-cost prep tasks.</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 w-full md:w-auto">
          <div><span className="text-white font-semibold">Staff:</span> 1 Absent</div>
          <div className="h-3 w-px bg-white/10" />
          <div><span className="text-white font-semibold">Forecast:</span> Rain @ 6 PM</div>
          <div className="h-3 w-px bg-white/10" />
          <div><span className="text-white font-semibold">Goal:</span> Prep &lt; 9 min</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-white">Morning Readiness & Immediate Actions</h1>
        <p className="text-sm text-gray-400">Low-friction operational tasks required for today&apos;s shift.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {mockTodayDecisions.map(decision => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}
