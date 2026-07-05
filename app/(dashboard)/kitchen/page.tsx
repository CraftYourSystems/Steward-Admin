"use client";

import { useKanbanColumns } from "@/hooks/useKitchenOrders";
import { KanbanColumn } from "@/components/kitchen/orders/KanbanColumn";
import { ConnectionStatus } from "@/components/kitchen/layout/ConnectionStatus";
import { Flame, ChefHat, CheckCircle2 } from "lucide-react";
import { QueueHealthGauge } from "@/components/kitchen/intelligence/QueueHealthGauge";
import { PrepTimeMetrics } from "@/components/kitchen/intelligence/PrepTimeMetrics";
import { DelayedCausesChart } from "@/components/kitchen/intelligence/DelayedCausesChart";
import { TicketAgingList } from "@/components/kitchen/intelligence/TicketAgingList";
import { useQueueHealth, usePrepTimeByStation, useDelayMetrics, useDelayedOrderCauses, useTicketAging } from "@/hooks/useKitchenIntelligence";

export default function KitchenBoardPage() {
  const { newOrders, preparingOrders, readyOrders, isLoading } = useKanbanColumns();
  
  // Intelligence Hooks
  const queueHealth = useQueueHealth();
  const prepTime = usePrepTimeByStation();
  const delayMetrics = useDelayMetrics();
  const delayCauses = useDelayedOrderCauses();
  const ticketAging = useTicketAging();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0F0F0F]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
        <h1 className="text-[13px] font-semibold text-white/60 uppercase tracking-[0.15em]">
          Kitchen Board
        </h1>
        <ConnectionStatus />
      </div>

      {/* Intelligence Dashboard MVP */}
      <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-white/[0.06] bg-black/20">
        <QueueHealthGauge data={queueHealth.data} loading={queueHealth.isLoading} />
        <PrepTimeMetrics prepData={prepTime.data} delayData={delayMetrics.data} loading={delayMetrics.isLoading} />
        <DelayedCausesChart data={delayCauses.data} loading={delayCauses.isLoading} />
        <TicketAgingList data={ticketAging.data} loading={ticketAging.isLoading} />
      </div>

      {/* Kanban grid */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden min-h-0">
        <KanbanColumn
          title="New"
          icon={<Flame className="h-4 w-4 text-[#D9B872]" />}
          orders={newOrders}
          status="NEW"
          isLoading={isLoading}
          accentColor="#D9B872"
          emptyText="No new orders"
        />
        <KanbanColumn
          title="Preparing"
          icon={<ChefHat className="h-4 w-4 text-[#C8B6E2]" />}
          orders={preparingOrders}
          status="PREPARING"
          isLoading={isLoading}
          accentColor="#C8B6E2"
          emptyText="Nothing cooking"
        />
        <KanbanColumn
          title="Ready"
          icon={<CheckCircle2 className="h-4 w-4 text-[#92B9A5]" />}
          orders={readyOrders}
          status="READY"
          isLoading={isLoading}
          accentColor="#92B9A5"
          emptyText="Nothing ready yet"
        />
      </div>
    </div>
  );
}
