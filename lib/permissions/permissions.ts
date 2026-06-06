import type { UserRole } from "@/types";

export const Permissions = {
  FULL_ACCESS: "full:access",
  RESTAURANT_MANAGEMENT: "restaurant:management",
  MENU_MANAGEMENT: "menu:management",
  ORDER_MANAGEMENT: "order:management",
  ORDER_UPDATES: "order:updates",
  ORDER_VIEW: "order:view",          // read-only order list access
  STAFF_MANAGEMENT: "staff:management",
  KITCHEN_DASHBOARD: "kitchen:dashboard",
  TABLE_MANAGEMENT: "table:management",
  SESSION_MANAGEMENT: "session:management",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [Permissions.FULL_ACCESS],
  ADMIN: [
    Permissions.RESTAURANT_MANAGEMENT,
    Permissions.MENU_MANAGEMENT,
    Permissions.ORDER_MANAGEMENT,
    Permissions.STAFF_MANAGEMENT,
    Permissions.KITCHEN_DASHBOARD,
    Permissions.ORDER_UPDATES,
    Permissions.ORDER_VIEW,
    Permissions.SESSION_MANAGEMENT,
  ],
  KITCHEN_STAFF: [
    Permissions.KITCHEN_DASHBOARD,
    Permissions.ORDER_UPDATES,
    Permissions.ORDER_VIEW,          // can browse order history (read-only)
  ],
  WAITER: [
    Permissions.KITCHEN_DASHBOARD,
    Permissions.ORDER_UPDATES,
    Permissions.ORDER_MANAGEMENT,   // waiters can manage/pay orders
    Permissions.TABLE_MANAGEMENT,
    Permissions.ORDER_VIEW,
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = rolePermissions[role] ?? [];
  return permissions.includes(Permissions.FULL_ACCESS) || permissions.includes(permission);
}

