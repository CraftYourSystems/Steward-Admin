"use client";

/**
 * useSocket — Admin dashboard socket subscription.
 * Joins admin:* and restaurant:* rooms; invalidates orders, menu-items,
 * and analytics queries when orders change so the dashboard stays live.
 */

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useBaseSocket } from "@/hooks/useBaseSocket";

interface UseSocketOptions {
  /** Set to false to disable subscription (e.g. for non-admin roles). Default: true */
  enabled?: boolean;
}

export function useSocket({ enabled = true }: UseSocketOptions = {}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // ── Invalidators ──────────────────────────────────────────────────────────

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["recent-orders-table"] });
  }, [queryClient]);

  /**
   * Invalidate all analytics caches so the KPI cards and charts
   * update as soon as an order status changes or a new order arrives.
   * This is especially important for the "today" range where staleTime
   * is short but we still want instant feedback on changes.
   */
  const invalidateAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    queryClient.invalidateQueries({ queryKey: ["analytics-revenue"] });
    queryClient.invalidateQueries({ queryKey: ["analytics-top-items"] });
    queryClient.invalidateQueries({ queryKey: ["recent-orders-table"] });
    // Also refresh the all-time orders check used by the onboarding banner
    queryClient.invalidateQueries({ queryKey: ["all-time-orders-check"] });
  }, [queryClient]);

  const handleOrderCreated = useCallback(() => {
    invalidateOrders();
    invalidateAnalytics();
    // Also refresh the notification bell badge count
    queryClient.invalidateQueries({ queryKey: ["header-recent-orders"] });
    toast.info("New order received!", { description: "Check the orders page." });
  }, [queryClient, invalidateOrders, invalidateAnalytics]);

  const handleOrderUpdated = useCallback(() => {
    invalidateOrders();
    // Re-fetch analytics so revenue / completed count stay accurate after
    // an order is moved to COMPLETED or CANCELLED.
    invalidateAnalytics();
  }, [invalidateOrders, invalidateAnalytics]);

  const invalidateMenuItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
  }, [queryClient]);

  const restaurantId = user?.restaurantId;

  const events = useMemo(() => ({
    "order:updated": handleOrderUpdated,
    "order:created": handleOrderCreated,
    "item:availability_changed": invalidateMenuItems,
  }), [handleOrderUpdated, handleOrderCreated, invalidateMenuItems]);

  const rooms = useMemo(
    () =>
      restaurantId
        ? [`admin:${restaurantId}`, `restaurant:${restaurantId}`]
        : [],
    [restaurantId]
  );

  useBaseSocket({
    enabled: enabled && !!restaurantId,
    rooms,
    events,
  });
}
