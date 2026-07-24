import { DecisionCard, Decision } from "@/components/needle/DecisionCard";

const mockDecisions: Decision[] = [
  {
    id: "dec_1",
    tenantId: "t_1",
    observation: "Burger demand is unusually high today.",
    evidence: ["Rain forecast increased comfort food orders by 24% over the last hour."],
    impact: "Potential stockout of patties before 12:00 PM.",
    confidence: 94,
    recommendation: "Prepare 30 extra patties immediately to meet the upcoming rush.",
    action: {
      type: "NAVIGATE",
      label: "Open Prep List",
      destinationUrl: "/inventory/prep"
    },
    sourceModule: "inventory_prediction",
    urgency: "HIGH",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: "dec_2",
    tenantId: "t_1",
    observation: "Labor cost is pacing 12% under budget for the morning shift.",
    evidence: ["Sales are tracking normal, but 2 staff members called in sick."],
    impact: "Service times may suffer if volume spikes during lunch.",
    confidence: 88,
    recommendation: "Call in 1 backup server for the 11 AM - 3 PM shift.",
    action: {
      type: "NAVIGATE",
      label: "Manage Schedule",
      destinationUrl: "/staff/schedule"
    },
    sourceModule: "labor_prediction",
    urgency: "MEDIUM",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  }
];

export default function NeedleTodayPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Today</h1>
        <p className="text-sm text-gray-400">Everything relevant today: Briefs, recommendations, and risks.</p>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min">
        {mockDecisions.map(decision => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}
