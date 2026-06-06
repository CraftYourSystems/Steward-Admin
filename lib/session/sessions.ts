import api from "@/lib/axios";
import type { ApiSuccess } from "@/types";

export interface ActiveSession {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export async function listSessions() {
  const { data } = await api.get<ApiSuccess<ActiveSession[]>>("/auth/sessions");
  return data.data ?? [];
}

export async function revokeSession(id: string) {
  await api.delete(`/auth/sessions/${id}`);
}

export async function revokeAllSessions() {
  await api.delete("/auth/sessions");
}
