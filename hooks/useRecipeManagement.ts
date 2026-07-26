import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface RecipeItem {
  id: string;
  menuItemId?: string | null;
  menuItemName?: string | null;
  sellingPrice: number;
  ingredientId?: string | null;
  prepIngredientName?: string | null;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  yieldPercent: number;
  cookingLossPercent: number;
  prepNotes?: string;
  ingredientCount: number;
  totalCost: number;
  updatedAt: string;
}

export interface RecipeBreakdownItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  extendedCost: number;
  contributionPercent: number;
}

export interface RecipeBreakdown {
  recipeId: string;
  menuItemId?: string | null;
  menuItemName?: string | null;
  ingredientId?: string | null;
  prepIngredientName?: string | null;
  sellingPrice: number;
  subTotalCost: number;
  totalRecipeCost: number;
  grossMargin: number;
  foodCostPercent: number;
  yieldPercent: number;
  cookingLossPercent: number;
  status: string;
  version: number;
  prepNotes: string;
  ingredients: RecipeBreakdownItem[];
}

export interface ValidationError {
  type: "MISSING_INGREDIENTS" | "DUPLICATE_INGREDIENTS" | "INVALID_QUANTITY" | "CIRCULAR_REFERENCE" | "UNLINKED_MENU_ITEM";
  severity: "WARNING" | "ERROR" | "CRITICAL";
  message: string;
}

export interface RecipeDashboardSummary {
  totalRecipes: number;
  missingIngredients: number;
  averageRecipeCost: number;
  mostExpensiveRecipes: Array<{ name: string; value: number }>;
  lowestMarginRecipes: Array<{ name: string; value: number }>;
  errorsCount: number;
}

export function useRecipeDashboard() {
  return useQuery<RecipeDashboardSummary>({
    queryKey: ["recipe-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-recipes/dashboard-summary");
      return data.data as RecipeDashboardSummary;
    }
  });
}

export function useRecipes(filters?: { menuItemId?: string; status?: string; search?: string }) {
  return useQuery<RecipeItem[]>({
    queryKey: ["recipes", filters],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-recipes", {
        params: filters
      });
      return (data.data || []) as RecipeItem[];
    }
  });
}

export function useRecipeBreakdown(recipeId: string | null) {
  return useQuery<RecipeBreakdown>({
    queryKey: ["recipe-breakdown", recipeId],
    queryFn: async () => {
      if (!recipeId) throw new Error("Recipe ID is required");
      const { data } = await api.get(`/admin/inventory-recipes/${recipeId}/breakdown`);
      return data.data as RecipeBreakdown;
    },
    enabled: !!recipeId
  });
}

export function useValidateRecipes() {
  return useQuery<ValidationError[]>({
    queryKey: ["recipe-validations"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory-recipes/validate");
      return (data.data || []) as ValidationError[];
    }
  });
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      menuItemId?: string | null;
      ingredientId?: string | null;
      status: string;
      yieldPercent?: number;
      cookingLossPercent?: number;
      prepNotes?: string;
      ingredients: Array<{
        ingredientId: string;
        quantity: number;
        unitId?: string | null;
        sortOrder?: number;
      }>;
    }) => {
      const { data } = await api.post("/admin/inventory-recipes", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["recipe-validations"] });
    }
  });
}
