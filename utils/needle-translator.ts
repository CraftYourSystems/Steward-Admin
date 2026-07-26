import { BriefingItem, PriorityLevel } from "@/lib/needle-api";
import { Decision, RecommendationType, Urgency } from "@/components/needle/DecisionCard";

export function translateBriefingItemToDecision(item: BriefingItem): Decision {
  const { id, key, params, priority, category } = item;

  let observation = "Unknown signal";
  let evidence: string[] = [];
  let impact = "";
  let recommendation = "";
  let type: RecommendationType = "INFO" as any; // Map appropriately
  let urgency: Urgency = priority as Urgency;
  let label = "View Details";
  let destinationUrl = "/";

  switch (key) {
    case "LOW_STOCK_ITEMS":
      observation = `${params.count} items have fallen below minimum stock thresholds.`;
      evidence = [`Current low stock count: ${params.count} items.`];
      impact = "Risk of 86-ing menu items during peak hours if not restocked.";
      recommendation = "Review inventory and place orders with suppliers immediately.";
      type = priority === "CRITICAL" ? "ALERT" : "WARNING";
      label = "View Inventory";
      destinationUrl = "/inventory";
      break;
    
    case "STOCK_LEVELS_HEALTHY":
      observation = "Inventory stock levels are healthy.";
      evidence = [`Low stock items: ${params.count}`];
      recommendation = "No immediate action required.";
      type = "INSIGHT";
      label = "View Inventory";
      destinationUrl = "/inventory";
      break;

    case "TOTAL_STOCK_VALUATION":
      observation = "Current stock valuation calculated.";
      evidence = [`Total stock value: ₹${params.totalStockValue}`];
      recommendation = "Maintain current stock ratios.";
      type = "INSIGHT";
      label = "View Finances";
      destinationUrl = "/reports";
      break;

    case "WASTE_LOGGED":
      observation = `Waste logged: ₹${params.amount}`;
      evidence = [`Total waste value for the period: ₹${params.amount}`];
      impact = "High waste impacts profit margins.";
      recommendation = "Review waste logs to identify patterns.";
      type = "WARNING";
      label = "View Waste Logs";
      destinationUrl = "/inventory?tab=waste";
      break;

    case "REFUND_THRESHOLD_CRITICAL":
      observation = `Refund rates are critically high at ${params.refundPct}%.`;
      evidence = [`Total refunds: ₹${params.totalRefunds}`, `Refund percentage: ${params.refundPct}%`];
      impact = "Significant revenue loss and potential customer satisfaction issues.";
      recommendation = "Investigate recent orders for quality issues or operational failures immediately.";
      type = "ALERT";
      label = "View Refunds";
      destinationUrl = "/finance/refunds";
      break;

    case "REFUND_THRESHOLD_WARNING":
      observation = `Refund rates are elevated at ${params.refundPct}%.`;
      evidence = [`Total refunds: ₹${params.totalRefunds}`, `Refund percentage: ${params.refundPct}%`];
      impact = "Profit margin reduction and potential negative reviews.";
      recommendation = "Review kitchen output and staff training for recent errors.";
      type = "WARNING";
      label = "View Refunds";
      destinationUrl = "/finance/refunds";
      break;

    case "AVG_PREP_TIME_CRITICAL":
      observation = `Kitchen prep times are critically delayed (Avg: ${params.avgPrepTimeMins} mins).`;
      evidence = [`Average prep time is ${params.avgPrepTimeMins} minutes.`];
      impact = "Customer wait times are unacceptable, risking walkouts and bad reviews.";
      recommendation = "Add staff to the line or throttle incoming online orders.";
      type = "ALERT";
      label = "View Kitchen";
      destinationUrl = "/kitchen";
      break;

    case "AVG_PREP_TIME_WARNING":
      observation = `Kitchen prep times are elevated (Avg: ${params.avgPrepTimeMins} mins).`;
      evidence = [`Average prep time is ${params.avgPrepTimeMins} minutes.`];
      impact = "Potential bottleneck forming during peak hours.";
      recommendation = "Monitor station loads and prepare for rush.";
      type = "WARNING";
      label = "View Kitchen";
      destinationUrl = "/kitchen";
      break;

    case "DELAYED_ORDERS_WARNING":
      observation = `${params.delayedCount} orders are currently delayed in the kitchen.`;
      evidence = [`Delayed order count: ${params.delayedCount}`];
      impact = "Backlog will compound if not cleared quickly.";
      recommendation = "Prioritize delayed tickets and coordinate with expediter.";
      type = "WARNING";
      label = "View Live Ops";
      destinationUrl = "/live";
      break;

    default:
      observation = `Operational Signal: ${key.replace(/_/g, ' ')}`;
      evidence = Object.entries(params).map(([k, v]) => `${k}: ${v}`);
      recommendation = "Review this operational metric.";
      type = priority === "CRITICAL" ? "ALERT" : priority === "HIGH" ? "WARNING" : "INSIGHT";
      break;
  }

  // Fallback map for priority to urgency if not perfectly matched
  const priorityToUrgency: Record<PriorityLevel, Urgency> = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
    INFO: "LOW"
  };

  return {
    id: id,
    tenantId: "system",
    type: type,
    observation,
    evidence,
    impact,
    confidence: 95, // Backend rule engine is deterministic
    recommendation,
    action: {
      type: "NAVIGATE",
      label,
      destinationUrl
    },
    sourceModule: category,
    urgency: priorityToUrgency[priority] || "MEDIUM",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}
