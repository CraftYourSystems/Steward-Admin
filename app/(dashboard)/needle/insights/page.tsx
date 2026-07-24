import { DecisionCard, Decision } from "@/components/needle/DecisionCard";
import { TrendingUp, BarChart3 } from "lucide-react";

const mockInsightDecisions: Decision[] = [
  {
    id: "dec_ins_1",
    tenantId: "t_1",
    observation: "Butter Chicken sold out twice during peak hours this week.",
    evidence: ["Stockout logs show 14 unfulfilled orders between 8 PM - 9 PM on Friday & Saturday."],
    impact: "Estimated ₹4,200 lost revenue per weekend shift.",
    confidence: 94,
    recommendation: "Consider increasing base batch prep by +20% for weekend evening shifts.",
    action: {
      type: "NAVIGATE",
      label: "Adjust Menu Prep Margins",
      destinationUrl: "/menu"
    },
    sourceModule: "sales_analytics",
    urgency: "LOW",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 604800000).toISOString()
  },
  {
    id: "dec_ins_2",
    tenantId: "t_1",
    observation: "Labor cost trending 4.5% higher on Tuesdays.",
    evidence: ["Tuesday afternoon sales average ₹12,000, while 5 staff members are clocked in."],
    impact: "Unnecessary payroll overhead during low-volume hours.",
    confidence: 87,
    recommendation: "Review Tuesday afternoon shift scheduling to optimize labor ratio.",
    action: {
      type: "NAVIGATE",
      label: "Review Roster",
      destinationUrl: "/staff"
    },
    sourceModule: "labor_analytics",
    urgency: "LOW",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 604800000).toISOString()
  }
];

export default function NeedleInsightsPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-semibold tracking-tight text-white">Business & Strategic Insights</h1>
          </div>
          <p className="text-sm text-gray-400">Level 3 intelligence: Weekly performance trends, labor ratio, and margin optimization. (Non-interruptive).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {mockInsightDecisions.map(decision => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}
