import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useMenuConversion() {
  return useQuery({
    queryKey: ["v2-menu-conversion"],
    queryFn: async () => {
      const { data } = await api.get("/admin/v2-analytics/menu-conversion");
      return data.data as {
        menuItemId: string;
        name: string;
        views: number;
        adds: number;
        orders: number;
        conversionRate: number;
        abandonmentRate: number;
      }[];
    }
  });
}

export function useOrderMetricsV2() {
  return useQuery({
    queryKey: ["v2-order-metrics"],
    queryFn: async () => {
      const { data } = await api.get("/admin/v2-analytics/order-metrics");
      return data.data as {
        modifierAttachRate: number;
        crossSellingRate: number;
        upsellingRate: number;
        avgTableTurnoverMins: number;
        splitBillFrequency: number;
      };
    }
  });
}

export function useRepeatItems() {
  return useQuery({
    queryKey: ["v2-repeat-items"],
    queryFn: async () => {
      const { data } = await api.get("/admin/v2-analytics/repeat-items");
      return data.data as {
        menuItemId: string;
        name: string;
        trialOrders: number;
        repeatOrders: number;
        repeatRate: number;
      }[];
    }
  });
}
