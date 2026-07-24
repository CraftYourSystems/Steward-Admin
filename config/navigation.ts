import {
  LayoutDashboard,
  ShoppingCart,
  Kanban,
  BanknoteIcon,
  Menu as MenuIcon,
  PackageOpen,
  ToggleLeft,
  ClipboardList,
  Users,
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
  icon: LucideIcon;
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
        icon: ShoppingCart,
        roles: ["ADMIN", "SUPER_ADMIN", "WAITER"],
      },
      {
        label: "Kitchen",
        href: "/kitchen",
        icon: Kanban,
        roles: ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF", "WAITER"],
      },
      {
        label: "Counter",
        href: "/pay-at-counter",
        icon: BanknoteIcon,
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
        icon: MenuIcon,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Inventory",
        href: "/inventory",
        icon: PackageOpen,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Availability",
        href: "/kitchen/availability",
        icon: ToggleLeft,
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
        icon: ClipboardList,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Finance",
        href: "/finance",
        icon: BanknoteIcon,
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
        label: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },
];
