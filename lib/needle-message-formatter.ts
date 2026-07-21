import { formatCurrency } from "@/lib/utils";

export interface ParameterizedMessage {
  key: string;
  params: Record<string, any>;
}

const MESSAGE_TEMPLATES: Record<string, (params: Record<string, any>) => string> = {
  // Inventory
  LOW_STOCK_ITEMS: (p) =>
    `${p.count} ingredient${p.count !== 1 ? "s are" : " is"} below minimum reorder level.`,
  STOCK_LEVELS_HEALTHY: () =>
    "All stock levels are currently healthy.",
  TOTAL_STOCK_VALUATION: (p) =>
    `Total inventory valuation stands at ${formatCurrency(p.totalStockValue, "INR")}.`,
  WASTE_LOGGED: (p) =>
    `Waste logged: ${formatCurrency(p.amount, "INR")}.`,

  // Finance
  NET_REVENUE_SUMMARY: (p) =>
    `Net sales reached ${formatCurrency(p.netSales, "INR")} across orders (Gross: ${formatCurrency(p.grossSales, "INR")}).`,
  REFUND_THRESHOLD_WARNING: (p) =>
    `Refund total of ${formatCurrency(p.totalRefunds, "INR")} reached ${p.refundPct}% of net sales.`,
  REFUND_THRESHOLD_CRITICAL: (p) =>
    `Critical refund alert: ${formatCurrency(p.totalRefunds, "INR")} (${p.refundPct}% of net sales).`,
  TOP_CHANNEL_CONTRIBUTION: (p) =>
    `Top sales channel: ${p.channel} (${formatCurrency(p.revenue, "INR")}).`,

  // Kitchen
  AVG_PREP_TIME_OPTIMAL: (p) =>
    `Average prep time is ${Math.round(p.avgPrepTimeMins)} minutes.`,
  AVG_PREP_TIME_WARNING: (p) =>
    `Prep time averaging ${Math.round(p.avgPrepTimeMins)} minutes (exceeding 15 min target).`,
  AVG_PREP_TIME_CRITICAL: (p) =>
    `Critical kitchen delay: Prep time averaging ${Math.round(p.avgPrepTimeMins)} minutes.`,
  DELAYED_ORDERS_WARNING: (p) =>
    `${p.delayedCount} order${p.delayedCount !== 1 ? "s were" : " was"} delayed past SLA target.`,
  KITCHEN_QUEUE_CLEARED: (p) =>
    `Kitchen queue cleared; ${p.completedCount ?? 0} orders completed.`,
  KITCHEN_QUEUE_ACTIVE: (p) =>
    `${p.activeCount} active order${p.activeCount !== 1 ? "s" : ""} in queue (${p.preparingCount} preparing).`,

  // Branch & Staff
  BRANCH_READINESS_METRICS: (p) =>
    `Branch ${p.branchCode}: ${p.staffCount} staff online across ${p.qrCount} active QR tables.`,

  // Customer & Reports
  CUSTOMER_VOLUME_SUMMARY: (p) =>
    `${p.totalOrders} total orders across ${p.totalDistinctCustomers} distinct customers.`,
};

export function formatNeedleMessage(item: ParameterizedMessage): string {
  const formatter = MESSAGE_TEMPLATES[item.key];
  if (formatter) {
    try {
      return formatter(item.params || {});
    } catch {
      return item.key;
    }
  }
  return item.key.replace(/_/g, " ").toLowerCase();
}
