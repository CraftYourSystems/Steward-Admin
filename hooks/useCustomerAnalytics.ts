import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface Params {
  from: string;
  to: string;
}

export function useNewVsReturning(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["customer-new-vs-returning", params],
    queryFn: async () => {
      const { data } = await api.get("/customers/analytics/new-vs-returning", { params });
      return data.data as { date: string; newCustomers: number; returningCustomers: number }[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRepeatPurchaseRate(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["customer-repeat-rate", params],
    queryFn: async () => {
      const { data } = await api.get("/customers/analytics/repeat-purchase-rate", { params });
      return data.data as { totalCustomers: number; repeatCustomers: number; rate: number };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVisitFrequency(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["customer-visit-frequency", params],
    queryFn: async () => {
      const { data } = await api.get("/customers/analytics/visit-frequency", { params });
      return data.data as { histogram: { bucket: string; customerCount: number }[]; median: number };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCohortRetention(enabled = true) {
  return useQuery({
    queryKey: ["customer-cohort-retention"],
    queryFn: async () => {
      const { data } = await api.get("/customers/analytics/cohort-retention");
      return data.data as { month: string; total: number; retention: Record<number, number> }[];
    },
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useAverageSpendTrend(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["customer-avg-spend-trend", params],
    queryFn: async () => {
      const { data } = await api.get("/customers/analytics/average-spend-trend", { params });
      return data.data as { date: string; averageSpend: number; orders: number }[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRFMLoyalty() {
  return useQuery({
    queryKey: ["customer-rfm-loyalty"],
    queryFn: async () => {
      const { data } = await api.get("/customers/analytics/rfm-loyalty");
      return data.data as {
        segments: { champions: number; atRisk: number; new: number; lost: number };
        customers: {
          id: string;
          name: string;
          totalOrders: number;
          totalSpend: number;
          recencyDays: number;
          timeBetweenVisits: number;
          segment: string;
          loyaltyScore: number;
          favoriteItem: string | null;
          favoriteCategory: string | null;
        }[];
      };
    },
  });
}

export function useCustomerJourney() {
  return useQuery({
    queryKey: ["customer-journey"],
    queryFn: async () => {
      const { data } = await api.get("/customers/analytics/journey");
      return data.data as {
        stage: string;
        count: number;
        description: string;
      }[];
    },
  });
}
