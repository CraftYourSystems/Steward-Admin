import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useQueueHealth(enabled = true) {
  return useQuery({
    queryKey: ["kitchen-queue-health"],
    queryFn: async () => {
      const { data } = await api.get("/kitchen/intelligence/queue-health");
      return data.data as { activeOrders: number; capacity: number; status: 'green' | 'amber' | 'red' };
    },
    enabled,
    refetchInterval: 10000, // poll every 10s
  });
}

export function usePrepTimeByStation(enabled = true) {
  return useQuery({
    queryKey: ["kitchen-prep-time"],
    queryFn: async () => {
      const { data } = await api.get("/kitchen/intelligence/prep-time-by-station");
      return data.data as { station: string; avgPrepTimeMins: number }[];
    },
    enabled,
    staleTime: 60000,
  });
}

export function useDelayMetrics(enabled = true) {
  return useQuery({
    queryKey: ["kitchen-delay-metrics"],
    queryFn: async () => {
      const { data } = await api.get("/kitchen/intelligence/delay-metrics");
      return data.data as { avgKitchenDelayMins: number; avgFohDelayMins: number; totalOrders: number };
    },
    enabled,
    staleTime: 60000,
  });
}

export function useDelayedOrderCauses(enabled = true) {
  return useQuery({
    queryKey: ["kitchen-delayed-causes"],
    queryFn: async () => {
      const { data } = await api.get("/kitchen/intelligence/delayed-order-causes");
      return data.data as { delayedRate: number; totalDelayed: number; pareto: { reason: string; count: number }[] };
    },
    enabled,
    staleTime: 60000,
  });
}

export function useTicketAging(enabled = true) {
  return useQuery({
    queryKey: ["kitchen-ticket-aging"],
    queryFn: async () => {
      const { data } = await api.get("/kitchen/intelligence/ticket-aging");
      return data.data as { 
        id: string; 
        orderNumber: string; 
        createdAt: string; 
        estimatedMins: number; 
        orderType: string; 
        delayReason: string | null;
        elapsedMins: number;
        isDelayed: boolean;
      }[];
    },
    enabled,
    refetchInterval: 10000,
  });
}

export function useRemakeRate(enabled = true) {
  return useQuery({
    queryKey: ["kitchen-remake-rate"],
    queryFn: async () => {
      const { data } = await api.get("/kitchen/intelligence/remake-rate");
      return data.data as { total: number; remakes: number; rate: number };
    },
    enabled,
    staleTime: 60000,
  });
}
