import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface SupplierRecord {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  paymentTerms?: string;
  leadTimeDays: number;
  isPreferred: boolean;
  outstandingBalance: number;
  lastPurchaseAt?: string;
}

export interface POItemRecord {
  id: string;
  ingredientId: string;
  ingredient: { name: string; unit: string };
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  taxPercent: number;
  discountAmount: number;
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: { name: string };
  orderDate: string;
  expectedDelivery?: string;
  status: "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED" | "CLOSED";
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  notes?: string;
  createdById?: string;
  createdAt: string;
  items: POItemRecord[];
}

export interface SupplierPerformanceRecord {
  id: string;
  name: string;
  score: number;
  outstandingBalance: number;
  leadTimeDays: number;
}

export interface ProcurementDashboardData {
  openPOs: number;
  awaitingDelivery: number;
  receivedToday: number;
  spendToday: number;
  outstandingSupplierBalance: number;
  supplierPerformanceScore: number;
  supplierPerformance: SupplierPerformanceRecord[];
}

export function useProcurementDashboard() {
  return useQuery<ProcurementDashboardData>({
    queryKey: ["procurement-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-procurement/dashboard");
      return data.data as ProcurementDashboardData;
    }
  });
}

export function useSuppliers() {
  return useQuery<SupplierRecord[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-procurement/suppliers");
      return (data.data || []) as SupplierRecord[];
    }
  });
}

export function useSaveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SupplierRecord>) => {
      const { data } = await api.post("/admin/inventory-procurement/suppliers", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-dashboard"] });
    }
  });
}

export function useArchiveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/inventory-procurement/suppliers/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-dashboard"] });
    }
  });
}

export function useMergeSuppliers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { sourceId: string; targetId: string }) => {
      const { data } = await api.post("/admin/inventory-procurement/suppliers/merge", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-dashboard"] });
    }
  });
}

export function usePurchaseOrders() {
  return useQuery<PurchaseOrderRecord[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-procurement/purchase-orders");
      return (data.data || []) as PurchaseOrderRecord[];
    }
  });
}

export function useCreatePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      supplierId: string;
      expectedDelivery?: string;
      notes?: string;
      items: Array<{
        ingredientId: string;
        orderedQty: number;
        unitCost: number;
        discountAmount?: number;
      }>;
      status: string;
    }) => {
      const { data } = await api.post("/admin/inventory-procurement/purchase-orders", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-dashboard"] });
    }
  });
}

export function useReceiveGoods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      purchaseOrderId: string;
      invoiceNumber?: string;
      items: Array<{
        ingredientId: string;
        receivedQty: number;
        damagedQty: number;
        rejectedQty: number;
        unitCost: number;
      }>;
    }) => {
      const { data } = await api.post("/admin/inventory-procurement/goods-receipt", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    }
  });
}
