import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface IntelligenceDashboard {
  inventoryValue: number;
  foodCostPercent: number;
  cogsToday: number;
  cogsThisMonth: number;
  inventoryTurnover: number;
  wasteCost: number;
  purchaseSpend: number;
  grossMargin: number;
  lowStockCount: number;
  negativeStockCount: number;
  inventoryAccuracy: number;
}

export interface CostAnalysisData {
  foodCostTrend: Array<{ period: string; value: number }>;
  purchaseSpend: Array<{ name: string; value: number }>;
  cogsByDay: Array<{ day: string; value: number }>;
}

export interface WasteAnalyticsData {
  topWasted: Array<{ name: string; quantity: number; cost: number }>;
  wasteReasons: Array<{ reason: string; value: number }>;
  wasteCostTotal: number;
}

export interface InventoryHealthData {
  deadStock: Array<{ id: string; name: string; currentStock: number; unit: string }>;
  overstocked: Array<{ id: string; name: string; currentStock: number; minStock: number; unit: string }>;
  nearMin: Array<{ id: string; name: string; currentStock: number; minStock: number; unit: string }>;
  slowMoving: Array<{ name: string; unit: string }>;
  fastMoving: Array<{ name: string; unit: string }>;
}

export interface ForecastSignal {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  projectedConsumption: number;
  daysRemaining: number;
  reorderSuggestion: number;
  confidenceScore: number;
}

export function useIntelligenceDashboard() {
  return useQuery<IntelligenceDashboard>({
    queryKey: ["intelligence-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-intelligence/dashboard");
      return data.data as IntelligenceDashboard;
    }
  });
}

export function useCostAnalysis() {
  return useQuery<CostAnalysisData>({
    queryKey: ["intelligence-cost-analysis"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-intelligence/cost-analysis");
      return data.data as CostAnalysisData;
    }
  });
}

export function useWasteAnalytics() {
  return useQuery<WasteAnalyticsData>({
    queryKey: ["intelligence-waste"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-intelligence/waste-analytics");
      return data.data as WasteAnalyticsData;
    }
  });
}

export function useInventoryHealth() {
  return useQuery<InventoryHealthData>({
    queryKey: ["intelligence-health"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-intelligence/health");
      return data.data as InventoryHealthData;
    }
  });
}

export function useForecastingReadiness() {
  return useQuery<ForecastSignal[]>({
    queryKey: ["intelligence-forecasting"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-intelligence/forecasting");
      return (data.data || []) as ForecastSignal[];
    }
  });
}
