"use client";

import { useMenuConversion, useOrderMetricsV2, useRepeatItems } from "@/hooks/useV2Analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/analytics/KpiCard";
import { Layers, Crosshair, ArrowUpCircle, Utensils, SplitSquareHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdvancedTab() {
  const menuConv = useMenuConversion();
  const orderMetrics = useOrderMetricsV2();
  const repeats = useRepeatItems();

  const isLoading = menuConv.isLoading || orderMetrics.isLoading || repeats.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] bg-white/5 rounded-[20px]" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full bg-white/5 rounded-[20px]" />
        <Skeleton className="h-[300px] w-full bg-white/5 rounded-[20px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* ── SECTION 1: Advanced Metrics KPI Ribbons ── */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-bold text-fg">Upsell & Ticket Expansion</h3>
          <p className="text-[11px] text-fg-subtle">Core modifiers, turnover speed, and split bill counts.</p>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <KpiCard
            title="Modifier Attach Rate"
            value={orderMetrics.data?.modifierAttachRate !== undefined ? `${orderMetrics.data.modifierAttachRate}%` : "0%"}
            icon={Layers}
            loading={orderMetrics.isLoading}
            description="% of items with mods"
            accent="accent"
          />
          <KpiCard
            title="Cross-Selling"
            value={orderMetrics.data?.crossSellingRate !== undefined ? `${orderMetrics.data.crossSellingRate}%` : "0%"}
            icon={Crosshair}
            loading={orderMetrics.isLoading}
            description="Multi-category orders"
            accent="info"
          />
          <KpiCard
            title="Upselling Rate"
            value={orderMetrics.data?.upsellingRate !== undefined ? `${orderMetrics.data.upsellingRate}%` : "0%"}
            icon={ArrowUpCircle}
            loading={orderMetrics.isLoading}
            description="% of orders with upsell"
            accent="success"
          />
          <KpiCard
            title="Table Turnover"
            value={orderMetrics.data?.avgTableTurnoverMins ? `${orderMetrics.data.avgTableTurnoverMins}m` : "0m"}
            icon={Utensils}
            loading={orderMetrics.isLoading}
            description="Avg DINE-IN time"
            accent="warning"
          />
          <KpiCard
            title="Split-Bill Freq"
            value={orderMetrics.data?.splitBillFrequency !== undefined ? `${orderMetrics.data.splitBillFrequency}%` : "0%"}
            icon={SplitSquareHorizontal}
            loading={orderMetrics.isLoading}
            description="Multiple payments per order"
            accent="danger"
          />
        </div>
      </div>

      {/* ── SECTION 2: Menu Conversion & Repeat Order Performance ── */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div>
          <h3 className="text-[14px] font-bold text-fg">Advanced Funnel & Customer Retention</h3>
          <p className="text-[11px] text-fg-subtle">Views to checkout conversion rates and product staple trends.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Menu Conversion */}
          <div className="space-y-2">
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5">
              <h3 className="text-[14px] font-semibold text-fg mb-4">Menu Conversion (Views → Orders)</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {menuConv.data?.map((item: any) => (
                  <div key={item.menuItemId} className="p-3 bg-[#131315] rounded-lg border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-[13px]">{item.name}</span>
                      <span className="text-[12px] font-bold text-success">{item.conversionRate}% Conv</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-fg-subtle">
                      <span>{item.views} Views</span>
                      <span>{item.adds} Cart Adds</span>
                      <span>{item.orders} Ordered</span>
                    </div>
                    <div className="mt-2 text-[10px] text-danger text-right">
                      {item.abandonmentRate}% Abandonment (Adds vs Orders)
                    </div>
                  </div>
                ))}
                {menuConv.data?.length === 0 && <p className="text-sm text-fg-muted italic">No conversion data yet.</p>}
              </div>
            </div>
            <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
              💡 **Insight**: Items with high abandonment rates usually benefit from descriptive pictures or combo pairings.
            </p>
          </div>

          {/* Repeat Items */}
          <div className="space-y-2">
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5">
              <h3 className="text-[14px] font-semibold text-fg mb-4">Item Repeat Orders (Staples vs Trials)</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {repeats.data?.map((item: any) => (
                  <div key={item.menuItemId} className="p-3 bg-[#131315] rounded-lg border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-[13px]">{item.name}</span>
                      <span className="text-[12px] font-bold text-info">{item.repeatRate}% Repeat</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-fg-subtle">
                      <span>{item.trialOrders} Trials (First time)</span>
                      <span>{item.repeatOrders} Staples (Bought before)</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden flex">
                      <div className="bg-fg-muted h-full" style={{ width: `${100 - item.repeatRate}%` }} />
                      <div className="bg-info h-full" style={{ width: `${item.repeatRate}%` }} />
                    </div>
                  </div>
                ))}
                {repeats.data?.length === 0 && <p className="text-sm text-fg-muted italic">No repeat order data yet.</p>}
              </div>
            </div>
            <p className="text-[11.5px] text-fg-muted italic pl-1 font-normal">
              💡 **Insight**: Items with repeat rates over 40% are your core customer staples—consider using them as base options for loyalty deals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}