import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface DeductionLogEntry {
  id: string;
  orderId: string;
  menuItemName: string;
  recipeVersion: number | null;
  ingredientName: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  status: "SUCCESS" | "FAILED";
  errorMessage: string;
  createdAt: string;
}

export interface InventoryAlertEntry {
  id: string;
  type: "MISSING_RECIPE" | "LOW_STOCK" | "NEGATIVE_STOCK";
  severity: "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  createdAt: string;
}

export interface DeductionDashboard {
  strictMode: boolean;
  totalDeductions: number;
  failedDeductions: number;
  missingRecipesCount: number;
  lowStockCount: number;
  negativeStockCount: number;
  alerts: InventoryAlertEntry[];
  logs: DeductionLogEntry[];
}

export function useDeductionDashboard() {
  return useQuery<DeductionDashboard>({
    queryKey: ["deduction-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-deductions/dashboard");
      return data.data as DeductionDashboard;
    }
  });
}

export function useToggleStrictMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await api.post("/admin/inventory-deductions/toggle-strict", { enabled });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deduction-dashboard"] });
    }
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await api.post(`/admin/inventory-deductions/resolve-alert/${alertId}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deduction-dashboard"] });
    }
  });
}
