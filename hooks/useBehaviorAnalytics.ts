import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useDropOffFunnel() {
  return useQuery({
    queryKey: ["behavior-funnel"],
    queryFn: async () => {
      const { data } = await api.get("/admin/behavior-analytics/funnel");
      return data.data as { scan: number; browse: number; cart: number; pay: number; dropOffToBrowse: number; dropOffToCart: number; dropOffToPay: number };
    }
  });
}

export function useScrollDepth() {
  return useQuery({
    queryKey: ["behavior-scroll-depth"],
    queryFn: async () => {
      const { data } = await api.get("/admin/behavior-analytics/scroll-depth");
      return data.data as { categoryId: string; count: number; percentReached: number }[];
    }
  });
}

export function useSearchAnalytics() {
  return useQuery({
    queryKey: ["behavior-search"],
    queryFn: async () => {
      const { data } = await api.get("/admin/behavior-analytics/search");
      return data.data as { query: string; count: number; zeroMatch: boolean }[];
    }
  });
}

export function useCartMetrics() {
  return useQuery({
    queryKey: ["behavior-cart-metrics"],
    queryFn: async () => {
      const { data } = await api.get("/admin/behavior-analytics/cart");
      return data.data as { abandonmentRate: number; abandonedCarts: number; avgDecisionTimeSec: number };
    }
  });
}

export function useScanToFirstAdd() {
  return useQuery({
    queryKey: ["behavior-scan-to-add"],
    queryFn: async () => {
      const { data } = await api.get("/admin/behavior-analytics/scan-to-add");
      return data.data as { medianTimeSec: number; avgTimeSec: number };
    }
  });
}
