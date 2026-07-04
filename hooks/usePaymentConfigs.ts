import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { extractApiError } from "@/lib/apiError";

export interface PaymentConfig {
  id: string;
  provider: string;
  environment: "sandbox" | "uat" | "production";
  isActive: boolean;
  isVerified: boolean;
  priority: number;
  healthStatus: "unknown" | "healthy" | "degraded" | "unreachable";
  lastVerifiedAt: string | null;
  lastFailedAt: string | null;
  consecutiveFailures: number;
  lastSuccessfulPaymentAt: string | null;
  lastWebhookReceivedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_CONFIGS_KEY = ["payment-configs"] as const;

export function usePaymentConfigs() {
  return useQuery({
    queryKey: PAYMENT_CONFIGS_KEY,
    queryFn: async () => {
      const { data } = await api.get("/payment-configs");
      return data.data as PaymentConfig[];
    },
  });
}

export function useAddPaymentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { provider: string; environment: string; credentials: Record<string, string> }) => {
      const { data } = await api.post("/payment-configs", payload);
      return data.data as PaymentConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIGS_KEY });
      toast.success("Payment configuration added successfully.");
    },
    onError: (err) => {
      toast.error(extractApiError(err) || "Failed to add payment configuration.");
    },
  });
}

export function useVerifyPaymentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/payment-configs/${id}/verify`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIGS_KEY });
      toast.success("Payment configuration verified.");
    },
    onError: (err) => {
      toast.error(extractApiError(err) || "Failed to verify configuration.");
    },
  });
}

export function useActivatePaymentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/payment-configs/${id}/activate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIGS_KEY });
      toast.success("Payment configuration activated.");
    },
    onError: (err) => {
      toast.error(extractApiError(err) || "Failed to activate configuration.");
    },
  });
}

export function useDeactivatePaymentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/payment-configs/${id}/deactivate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIGS_KEY });
      toast.success("Payment configuration deactivated.");
    },
    onError: (err) => {
      toast.error(extractApiError(err) || "Failed to deactivate configuration.");
    },
  });
}

export function useUpdatePaymentConfigPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) => {
      const { data } = await api.put(`/payment-configs/${id}/priority`, { priority });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIGS_KEY });
      toast.success("Provider priority updated.");
    },
    onError: (err) => {
      toast.error(extractApiError(err) || "Failed to update priority.");
    },
  });
}
