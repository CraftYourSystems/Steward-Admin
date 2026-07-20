import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useWastePercentage() {
  return useQuery({
    queryKey: ["inventory-waste"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/waste-percentage");
      return data.data as { id: string; name: string; unit: string; wastedQuantity: number; theoreticalUsage: number; wastePercent: number }[];
    }
  });
}

export function useStockoutIncidents() {
  return useQuery({
    queryKey: ["inventory-stockouts"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/stockout-incidents");
      return data.data as { id: string; ingredientId: string; name: string; unit: string; createdAt: string; resolvedAt: string | null; durationMins: number | null }[];
    }
  });
}

export function useCostTrends() {
  return useQuery({
    queryKey: ["inventory-cost-trends"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-analytics/cost-trends");
      return data.data as { ingredientId: string; name: string; maxSpikePercent: number; isVolatile: boolean; changes: { date: string; oldCost: number; newCost: number; percentChange: number }[] }[];
    }
  });
}

export interface InventoryItem {

  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier: string;
  lastUpdated: string;
}

export function useInventoryItems() {
  return useQuery({
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
    mutationFn: async (newItem: Omit<InventoryItem, "id" | "lastUpdated">) => {
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
      };
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
        previousItems.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem, lastUpdated: "Just now" } : item))
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

