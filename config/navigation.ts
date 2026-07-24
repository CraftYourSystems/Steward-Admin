import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Settings,
  Activity,
  LucideIcon
} from "lucide-react";

export type Role = "ADMIN" | "SUPER_ADMIN" | "KITCHEN_STAFF" | "WAITER";

export interface NavItem {
  label: string;
  href: string;
  roles: Role[];
  icon?: LucideIcon;
  isSparkle?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    label: "",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Live Orders",
        href: "/live-counter",
        icon: Activity,
        roles: ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF", "WAITER"],
      }
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Orders",
        href: "/orders",
        roles: ["ADMIN", "SUPER_ADMIN", "WAITER"],
      },
      {
        label: "Kitchen",
        href: "/kitchen",
        roles: ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF", "WAITER"],
      },
      {
        label: "Counter",
        href: "/pay-at-counter",
        roles: ["ADMIN", "SUPER_ADMIN", "WAITER"],
      },
    ],
  },
  {
    label: "Products",
    items: [
      {
        label: "Menu",
        href: "/menu",
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Inventory",
        href: "/inventory",
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Availability",
        href: "/kitchen/availability",
        roles: ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF"],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Analytics",
        href: "/reports",
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Customers",
        href: "/customers",
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Finance",
        href: "/finance",
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },
  {
    label: "",
    items: [
      {
        label: "Needle AI",
        href: "/needle",
        icon: Sparkles,
        isSparkle: true,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },
  {
    label: "",
    items: [
      {
        label: "Organization",
        href: "/business", 
        icon: Briefcase,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Staff",
        href: "/staff",
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Logbook",
        href: "/logbook",
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },
];
