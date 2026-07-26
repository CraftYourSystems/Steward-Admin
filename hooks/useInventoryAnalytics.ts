import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useWastePercentage() {
  return useQuery<{ id: string; name: string; unit: string; wastedQuantity: number; theoreticalUsage: number; wastePercent: number }[]>({
    queryKey: ["inventory-waste"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/waste-percentage");
      return data.data;
    }
  });
}

export function useStockoutIncidents() {
  return useQuery<{ id: string; ingredientId: string; name: string; unit: string; createdAt: string; resolvedAt: string | null; durationMins: number | null }[]>({
    queryKey: ["inventory-stockouts"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/stockout-incidents");
      return data.data;
    }
  });
}

export function useCostTrends() {
  return useQuery<{ ingredientId: string; name: string; maxSpikePercent: number; isVolatile: boolean; changes: { date: string; oldCost: number; newCost: number; percentChange: number }[] }[]>({
    queryKey: ["inventory-cost-trends"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/cost-trends");
      return data.data;
    }
  });
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string | null;
  currentStock: number;
  minStock: number;
  unit: string;
  supplierId?: string;
  supplierName?: string;
  status: "ACTIVE" | "ARCHIVED";
  sku: string;
  barcode: string;
  storageLocation: string;
  description: string;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive: boolean;
  ingredientCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export function useInventoryCategories() {
  return useQuery<InventoryCategory[]>({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/categories");
      return (data.data || []) as InventoryCategory[];
    }
  });
}

export function useCreateInventoryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCategory: Omit<InventoryCategory, "id" | "isActive" | "ingredientCount" | "createdAt" | "updatedAt">) => {
      const { data } = await api.post("/admin/inventory-analytics/categories", newCategory);
      return data.data as InventoryCategory;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
    }
  });
}

export function useUpdateInventoryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updatedFields }: Partial<InventoryCategory> & { id: string }) => {
      const { data } = await api.patch(`/admin/inventory-analytics/categories/${id}`, updatedFields);
      return data.data as InventoryCategory;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
    }
  });
}

export function useDeleteInventoryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/inventory-analytics/categories/${id}`);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
    }
  });
}

export interface InventoryUnit {
  id: string;
  name: string;
  symbol: string;
  baseUnit?: string | null;
  conversionFactor?: number | null;
  isActive: boolean;
  ingredientCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useInventoryUnits() {
  return useQuery<InventoryUnit[]>({
    queryKey: ["inventory-units"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/units");
      return (data.data || []) as InventoryUnit[];
    }
  });
}

export function useCreateInventoryUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUnit: Omit<InventoryUnit, "id" | "isActive" | "ingredientCount" | "createdAt" | "updatedAt">) => {
      const { data } = await api.post("/admin/inventory-analytics/units", newUnit);
      return data.data as InventoryUnit;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-units"] });
    }
  });
}

export function useUpdateInventoryUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updatedFields }: Partial<InventoryUnit> & { id: string }) => {
      const { data } = await api.patch(`/admin/inventory-analytics/units/${id}`, updatedFields);
      return data.data as InventoryUnit;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-units"] });
    }
  });
}

export function useDeleteInventoryUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/inventory-analytics/units/${id}`);
      return id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-units"] });
    }
  });
}

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["inventory-suppliers"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/suppliers");
      return (data.data || []) as Supplier[];
    }
  });
}

export function useInventoryItems() {
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/items");
      return (data.data || []) as InventoryItem[];
    }
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newItem: Omit<InventoryItem, "id" | "lastUpdated" | "createdAt" | "updatedAt">) => {
      const { data } = await api.post("/admin/inventory-analytics/items", newItem);
      return data.data as InventoryItem;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ["inventory-items"] });
      const previousItems = queryClient.getQueryData<InventoryItem[]>(["inventory-items"]) || [];
      const optimisticItem: InventoryItem = {
        ...newItem,
        id: `temp-${Date.now()}`,
        lastUpdated: "Just now"
      } as InventoryItem;
      queryClient.setQueryData<InventoryItem[]>(["inventory-items"], [...previousItems, optimisticItem]);
      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["inventory-items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    }
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updatedFields }: Partial<InventoryItem> & { id: string }) => {
      const { data } = await api.patch(`/admin/inventory-analytics/items/${id}`, updatedFields);
      return data.data as InventoryItem;
    },
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: ["inventory-items"] });
      const previousItems = queryClient.getQueryData<InventoryItem[]>(["inventory-items"]) || [];
      queryClient.setQueryData<InventoryItem[]>(
        ["inventory-items"],
        previousItems.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem, lastUpdated: "Just now" } as any : item))
      );
      return { previousItems };
    },
    onError: (_err, _updatedItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["inventory-items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    }
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/inventory-analytics/items/${id}`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["inventory-items"] });
      const previousItems = queryClient.getQueryData<InventoryItem[]>(["inventory-items"]) || [];
      queryClient.setQueryData<InventoryItem[]>(
        ["inventory-items"],
        previousItems.filter((item) => item.id !== id)
      );
      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["inventory-items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    }
  });
}

