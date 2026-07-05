"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Users,
  LogOut, X, Settings, ToggleLeft, WifiOff, Kanban,
  Soup, ClipboardList, BanknoteIcon, Home, BarChart3, ArrowLeft,
  Megaphone, PackageOpen, Activity, Sparkles, BrainCircuit
} from "lucide-react";
import { usePlatformStore } from "@/stores/platform.store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/stores/settings.store";
import { hasPermission, Permissions } from "@/lib/permissions/permissions";

// ─── Nav definitions ──────────────────────────────────────────────────────────

const navAdmin = [
  { href: "/dashboard",      label: "Overview",        icon: LayoutDashboard },
  { href: "/live-ops",       label: "Live Ops",        icon: Activity },
  { href: "/insights",       label: "AI Insights",     icon: Sparkles },
  { href: "/ai",             label: "Predictive AI",   icon: BrainCircuit },
  { href: "/analytics",      label: "Analytics",       icon: BarChart3 },
  { href: "/finance",        label: "Finance",         icon: BanknoteIcon },
  { href: "/marketing",      label: "Marketing",       icon: Megaphone },
  { href: "/behavior",       label: "Behavior",        icon: BarChart3 },
  { href: "/customers",      label: "Customers",       icon: Users },
  { href: "/reports",        label: "Reports",         icon: ClipboardList },
  { href: "/orders",         label: "Orders",          icon: ShoppingCart },
  { href: "/pay-at-counter", label: "Pay at Counter",  icon: BanknoteIcon },
  { href: "/menu",           label: "Menu",            icon: UtensilsCrossed },
  { href: "/staff",          label: "Staff",           icon: Users },
  { href: "/inventory",      label: "Inventory",       icon: PackageOpen },
  { href: "/audit",          label: "Staff Logs",      icon: ClipboardList },
];

const navKitchen = [
  { href: "/kitchen",              label: "Kitchen Board", icon: Kanban },
  { href: "/kitchen/availability", label: "Availability",  icon: ToggleLeft },
  { href: "/live-counter",         label: "Live Counter",  icon: Soup },
];

const navWaiter = [
  { href: "/orders",         label: "Orders",         icon: ShoppingCart },
  { href: "/pay-at-counter", label: "Pay at Counter", icon: BanknoteIcon },
  { href: "/kitchen",        label: "Kitchen Board",  icon: Kanban },
  { href: "/live-counter",   label: "Live Counter",   icon: Soup },
];

// ─── Role visual configs ──────────────────────────────────────────────────────

const ROLE_CONFIGS: Record<string, {
  logoGlow: string;
  logoBg: string;
  logoText?: string;
  statusDot: string;
  statusText: string;
  accentColor: string;
}> = {
  ADMIN:         { logoGlow: "rgba(255,255,255,0.35)", logoBg: "bg-white",      logoText: "text-black", statusDot: "bg-white",    statusText: "Admin Mode",     accentColor: "#ffffff" },
  SUPER_ADMIN:   { logoGlow: "rgba(255,255,255,0.35)", logoBg: "bg-white",      logoText: "text-black", statusDot: "bg-white",    statusText: "Super Admin",    accentColor: "#ffffff" },
  KITCHEN_STAFF: { logoGlow: "rgba(217,184,114,0.35)", logoBg: "bg-[#D9B872]",  logoText: "text-black", statusDot: "bg-[#D9B872]", statusText: "Kitchen Active", accentColor: "#D9B872" },
  WAITER:        { logoGlow: "rgba(59,130,246,0.35)",  logoBg: "bg-info",       logoText: "text-white", statusDot: "bg-info",      statusText: "On Floor",       accentColor: "hsl(217,91%,60%)" },
};

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  onClose,
  accentColor,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClose: () => void;
  accentColor?: string;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (
      href !== "/dashboard" &&
      href !== "/kitchen" &&
      href !== "/kitchen-home" &&
      href !== "/waiter-home" &&
      pathname.startsWith(href + "/")
    );

  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "group relative flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium transition-all duration-300 ease-out active:scale-[0.98]",
          active
            ? "bg-surface-2 text-fg shadow-sm"
            : "text-fg-muted hover:bg-surface-2/50 hover:text-fg"
        )}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-1 rounded-r-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: accentColor ?? "hsl(var(--accent))", color: accentColor ?? "hsl(var(--accent))" }}
          />
        )}
        <Icon
          className={cn("h-4 w-4 shrink-0 transition-all duration-300", active ? "scale-110" : "text-fg-subtle group-hover:text-fg-muted")}
          style={active ? { color: accentColor ?? "hsl(var(--accent))" } : undefined}
        />
        <span className={cn("transition-transform duration-300", active && "translate-x-0.5")}>{label}</span>
      </Link>
    </li>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-xs px-2.5 mb-1.5 mt-0.5">{children}</div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { wsConnected } = useSettingsStore();
  const selectedRestaurant = usePlatformStore((s) => s.selectedRestaurant);
  const exitRestaurant = usePlatformStore((s) => s.exitRestaurant);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "—";

  const roleLabel =
    user?.role === "SUPER_ADMIN"   ? "Super Admin" :
    user?.role === "ADMIN"         ? "Admin" :
    user?.role === "KITCHEN_STAFF" ? "Kitchen Staff" :
    user?.role === "WAITER"        ? "Waiter" :
    user?.role ?? "";

  const isAdmin   = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isKitchen = user?.role === "KITCHEN_STAFF";
  const isWaiter  = user?.role === "WAITER";

  const canUseKitchen = hasPermission(user?.role, Permissions.KITCHEN_DASHBOARD);
  const canViewOrders = hasPermission(user?.role, Permissions.ORDER_VIEW);

  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  const cfg = ROLE_CONFIGS[user?.role ?? "ADMIN"] ?? ROLE_CONFIGS.ADMIN;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col",
          "bg-transparent border-r border-white/5",
          "transition-transform duration-200 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Logo mark — role-tinted */}
            <div
              className={cn("flex h-7 w-7 items-center justify-center rounded-md", cfg.logoBg)}
              style={{ boxShadow: `0 0 12px ${cfg.logoGlow}` }}
            >
              <span className={cn("text-[11px] font-bold", cfg.logoText ?? "text-white")}>S</span>
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-semibold text-fg">Steward</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse shrink-0", cfg.statusDot)} />
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider truncate"
                  style={{ color: cfg.accentColor }}
                >
                  {cfg.statusText}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span title={wsConnected ? "Connected — live updates active" : "Disconnected — check network"} className="shrink-0">
              {wsConnected ? (
                <div className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-success live-dot" />
                  </span>
                </div>
              ) : (
                <WifiOff className="h-3 w-3 text-fg-subtle" />
              )}
            </span>
            <button
              onClick={onClose}
              className="lg:hidden h-9 w-9 grid place-items-center rounded-md text-fg-muted hover:bg-surface-2 transition-colors touch-target"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin space-y-0">

          {/* Super Admin restaurant context banner */}
          {user?.role === "SUPER_ADMIN" && selectedRestaurant && (
            <div className="mx-1 mb-3 rounded-lg bg-violet-500/10 border border-violet-500/20 p-2.5">
              <p className="text-[10px] font-medium text-violet-400 uppercase tracking-wider mb-1">Viewing Restaurant</p>
              <p className="text-xs font-semibold text-fg truncate">{selectedRestaurant.name}</p>
              <button
                onClick={() => {
                  exitRestaurant();
                  router.push("/platform");
                }}
                className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Platform
              </button>
            </div>
          )}

          {/* ── Kitchen Staff ────────────────────────────────── */}
          {isKitchen && (
            <>
              <div className="mb-3">
                <SectionLabel>Home</SectionLabel>
                <ul className="space-y-0.5">
                  <NavLink href="/kitchen-home" label="Kitchen Home" icon={Home} onClose={onClose} accentColor={cfg.accentColor} />
                </ul>
              </div>
              <div className="mb-3">
                <SectionLabel>Kitchen</SectionLabel>
                <ul className="space-y-0.5">
                  {navKitchen.map((item) => (
                    <NavLink key={item.href} {...item} onClose={onClose} accentColor={cfg.accentColor} />
                  ))}
                </ul>
              </div>
              {canViewOrders && (
                <div className="mb-3">
                  <SectionLabel>Records</SectionLabel>
                  <ul className="space-y-0.5">
                    <NavLink href="/orders" label="Order History" icon={ShoppingCart} onClose={onClose} accentColor={cfg.accentColor} />
                  </ul>
                </div>
              )}
            </>
          )}

          {/* ── Waiter ──────────────────────────────────────── */}
          {isWaiter && (
            <>
              <div className="mb-3">
                <SectionLabel>Home</SectionLabel>
                <ul className="space-y-0.5">
                  <NavLink href="/waiter-home" label="Service Home" icon={Home} onClose={onClose} accentColor={cfg.accentColor} />
                </ul>
              </div>
              <div className="mb-3">
                <SectionLabel>Service</SectionLabel>
                <ul className="space-y-0.5">
                  {navWaiter.map((item) => (
                    <NavLink key={item.href} {...item} onClose={onClose} accentColor={cfg.accentColor} />
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ── Admin / Super Admin ──────────────────────────── */}
          {isAdmin && (
            <>
              <div className="mb-3">
                <SectionLabel>Management</SectionLabel>
                <ul className="space-y-0.5">
                  {navAdmin.map((item) => (
                    <NavLink key={item.href} {...item} onClose={onClose} />
                  ))}
                </ul>
              </div>

              {canUseKitchen && (
                <div className="mb-3">
                  <SectionLabel>Kitchen</SectionLabel>
                  <ul className="space-y-0.5">
                    {navKitchen.map((item) => (
                      <NavLink key={item.href} {...item} onClose={onClose} />
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-3">
                <SectionLabel>System</SectionLabel>
                <ul className="space-y-0.5">
                  <li>
                    <Link
                      href="/settings"
                      onClick={onClose}
                      className={cn(
                        "group relative flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.97] active:duration-75 border",
                        settingsActive
                          ? "bg-surface-3 text-fg border-border-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                          : "text-fg-muted hover:bg-surface-2 hover:text-fg border-transparent"
                      )}
                    >
                      {settingsActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-accent opacity-80" />
                      )}
                      <Settings
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          settingsActive ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted"
                        )}
                      />
                      <span>Settings</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}
        </nav>

        {/* Profile footer */}
        <div className="border-t border-border p-2.5 shrink-0">
          <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 border border-border px-2.5 py-2 hover:border-border-strong transition-colors group">
            {/* Avatar with role-tint */}
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-[11px] font-semibold text-fg shrink-0 bg-surface-3"
            >
              {initials}
            </div>

            {/* Name & role */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-fg leading-tight">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="truncate text-[10px] mt-0.5" style={{ color: cfg.accentColor }}>{roleLabel}</div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              title="Sign out"
              className="h-7 w-7 grid place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-danger transition-colors shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
