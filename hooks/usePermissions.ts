"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { hasPermission, type Permission } from "@/lib/permissions/permissions";

export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role);

  return useMemo(
    () => ({
      role,
      can: (permission: Permission) => hasPermission(role, permission),
      cannot: (permission: Permission) => !hasPermission(role, permission),
    }),
    [role],
  );
}

