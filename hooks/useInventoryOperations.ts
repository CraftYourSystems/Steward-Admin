import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredient: {
    name: string;
    unit: string;
  };
  movementType:
    | "RECEIVING"
    | "SALE_DEDUCTION"
    | "MANUAL_ADJUSTMENT"
    | "WASTE"
    | "TRANSFER"
    | "PHYSICAL_COUNT"
    | "RECIPE_CORRECTION"
    | "OPENING_BALANCE"
    | "CLOSING_BALANCE"
    | "SYSTEM_CORRECTION";
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  reason?: string;
  userId?: string;
  branchId?: string;
  status: string;
  createdAt: string;
}

export interface OperationsDashboardSummary {
  totalMovements: number;
  receivedQty: number;
  consumedQty: number;
  wasteQty: number;
  adjustmentsQty: number;
  pendingCount: number;
  timeline: Array<{
    id: string;
    time: string;
    date: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    type: string;
    reason: string;
    reference: string;
  }>;
}

export interface PhysicalCountItem {
  id: string;
  sessionId: string;
  ingredientId: string;
  ingredient: {
    name: string;
    unit: string;
  };
  expectedQty: number;
  recordedQty: number;
  variance: number;
}

export interface PhysicalCountSession {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED";
  createdAt: string;
  updatedAt: string;
  items: PhysicalCountItem[];
}

export function useInventoryOperationsDashboard() {
  return useQuery<OperationsDashboardSummary>({
    queryKey: ["inventory-ops-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-operations/dashboard-summary");
      return data.data as OperationsDashboardSummary;
    }
  });
}

export function useStockMovements(filters: {
  ingredientId?: string;
  movementType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery<StockMovement[]>({
    queryKey: ["inventory-movements", filters],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-operations/movements", {
        params: filters
      });
      return (data.data || []) as StockMovement[];
    }
  });
}

export function useReceiveStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      supplierId: string;
      invoiceNumber?: string;
      notes?: string;
      items: Array<{
        ingredientId: string;
        quantity: number;
        unitCost: number;
      }>;
    }) => {
      const { data } = await api.post("/admin/inventory-operations/receive", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-ops-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    }
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ingredientId: string;
      quantity: number;
      reason: string;
      notes?: string;
    }) => {
      const { data } = await api.post("/admin/inventory-operations/adjust", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-ops-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    }
  });
}

export function useRecordWaste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ingredientId: string;
      quantity: number;
      reason: string;
      notes?: string;
    }) => {
      const { data } = await api.post("/admin/inventory-operations/waste", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-ops-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    }
  });
}

export function usePhysicalCountSessions() {
  return useQuery<PhysicalCountSession[]>({
    queryKey: ["physical-count-sessions"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-operations/counts");
      return (data.data || []) as PhysicalCountSession[];
    }
  });
}

export function useCreatePhysicalCountSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/admin/inventory-operations/counts");
      return data.data as PhysicalCountSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physical-count-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-ops-dashboard"] });
    }
  });
}

export function useSavePhysicalCountItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      items
    }: {
      sessionId: string;
      items: Array<{ itemId: string; recordedQty: number }>;
    }) => {
      const { data } = await api.put(`/admin/inventory-operations/counts/${sessionId}`, { items });
      return data.data as PhysicalCountSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["physical-count-sessions"] });
      queryClient.setQueryData(["physical-count-session-active", data.id], data);
    }
  });
}

export function useApprovePhysicalCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post(`/admin/inventory-operations/counts/${sessionId}/approve`);
      return data.data as PhysicalCountSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physical-count-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-ops-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    }
  });
}
