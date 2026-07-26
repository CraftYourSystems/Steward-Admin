import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Decision } from "@/components/needle/DecisionCard";

export interface CostOptimizationData {
  mostExpensive: Array<{
    name: string;
    costPerUnit: number;
    unit: string;
    currentStock: number;
    totalValue: number;
  }>;
  wasteOpportunities: Array<{
    name: string;
    qty: number;
    cost: number;
  }>;
  marginSuggestions: Array<{
    suggestion: string;
    confidence: number;
  }>;
}

export interface OperationalInsight {
  question: string;
  answer: string;
  confidence: number;
  category: string;
}

export interface ForecastSignal {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  dailyConsumption: number;
  daysRemaining: number;
  reorderInDays: number;
  suggestedOrderQty: number;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
}

export interface ChatResponse {
  answer: string;
  cards: string[];
  source: string;
}

export function useNeedleAlerts() {
  return useQuery<Decision[]>({
    queryKey: ["needle-alerts"],
    queryFn: async () => {
      const res = await api.get("/v1/needle/alerts");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useNeedleRecommendations() {
  return useQuery<Decision[]>({
    queryKey: ["needle-recommendations"],
    queryFn: async () => {
      const res = await api.get("/v1/needle/recommendations");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useNeedleCostOptimization() {
  return useQuery<CostOptimizationData>({
    queryKey: ["needle-cost-optimization"],
    queryFn: async () => {
      const res = await api.get("/v1/needle/cost-optimization");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useNeedleInsights() {
  return useQuery<OperationalInsight[]>({
    queryKey: ["needle-insights"],
    queryFn: async () => {
      const res = await api.get("/v1/needle/insights");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useNeedleForecasts() {
  return useQuery<ForecastSignal[]>({
    queryKey: ["needle-forecasts"],
    queryFn: async () => {
      const res = await api.get("/v1/needle/forecasts");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useNeedleChat() {
  return useMutation<ChatResponse, Error, string>({
    mutationFn: async (question: string) => {
      const res = await api.post("/v1/needle/chat", { question });
      return res.data.data;
    },
  });
}
