"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Users,
  LogOut, X, Settings, ToggleLeft, WifiOff, Kanban,
  Soup, ClipboardList, BanknoteIcon, Home, BarChart3, ArrowLeft,
  Megaphone, PackageOpen, Activity, Sparkles, BrainCircuit,
  PanelLeftClose, PanelLeftOpen, ChevronDown, MapPin, Loader2, GitBranch
} from "lucide-react";
import { usePlatformStore } from "@/stores/platform.store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/stores/settings.store";
import { hasPermission, Permissions } from "@/lib/permissions/permissions";
import { Logo } from "@/components/ui/Logo";

// ─── Nav definitions ──────────────────────────────────────────────────────────

const navAdmin = [
  { href: "/needle",         label: "Needle",          icon: BrainCircuit },
  { href: "/finance",        label: "Finance",         icon: BanknoteIcon },
  { href: "/marketing",      label: "Marketing",       icon: Megaphone },
  { href: "/customers",      label: "Customers",       icon: Users },
  { href: "/reports",        label: "Reports",         icon: ClipboardList },
  { href: "/orders",         label: "Orders",          icon: ShoppingCart },
  { href: "/pay-at-counter", label: "Pay at Counter",  icon: BanknoteIcon },
  { href: "/menu",           label: "Menu",            icon: UtensilsCrossed },
  { href: "/staff",          label: "Staff",           icon: Users },
  { href: "/inventory",      label: "Inventory",       icon: PackageOpen },
  { href: "/logbook",        label: "Logbook",         icon: ClipboardList },
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
  statusDot: string;
  statusText: string;
  accentColor: string;
}> = {
  ADMIN:         { statusDot: "bg-white",    statusText: "Admin Mode",     accentColor: "#ffffff" },
  SUPER_ADMIN:   { statusDot: "bg-white",    statusText: "Super Admin",    accentColor: "#ffffff" },
  KITCHEN_STAFF: { statusDot: "bg-[#D9B872]", statusText: "Kitchen Active", accentColor: "#D9B872" },
  WAITER:        { statusDot: "bg-info",      statusText: "On Floor",       accentColor: "hsl(217,91%,60%)" },
};

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  onClose,
  accentColor,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClose: () => void;
  accentColor?: string;
  collapsed?: boolean;
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
        title={collapsed ? label : undefined}
        className={cn(
          "group relative flex items-center h-9 rounded-lg text-[13px] font-medium transition-all duration-300 ease-out active:scale-[0.98]",
          collapsed ? "justify-center gap-0 px-0" : "gap-3 px-3",
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
        <span
          className={cn(
            "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            active && !collapsed && "translate-x-0.5"
          )}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children, collapsed = false }: { children: React.ReactNode; collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "label-xs mb-1.5 mt-0.5 overflow-hidden whitespace-nowrap transition-all duration-300",
        collapsed ? "h-px px-1 opacity-20" : "px-2.5 opacity-100"
      )}
    >
      {collapsed ? <span className="block h-px bg-border" /> : children}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ open, onClose, collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    restaurant,
    currentBranch,
    accessibleBranches,
    isSwitchingBranch,
    switchBranch,
    logout,
  } = useAuth();
  const { wsConnected } = useSettingsStore();
  const selectedRestaurant = usePlatformStore((s) => s.selectedRestaurant);
  const exitRestaurant = usePlatformStore((s) => s.exitRestaurant);

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const restaurantName = user?.role === "SUPER_ADMIN" ? selectedRestaurant?.name : (restaurant?.name || "");

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
          "transition-[transform,width] duration-300 ease-out lg:relative lg:translate-x-0",
          collapsed ? "lg:w-[72px]" : "lg:w-[240px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className={cn("flex h-14 items-center justify-between border-b border-border shrink-0 transition-all duration-300", collapsed ? "px-3" : "px-4")}>
          <div className={cn("flex min-w-0 items-center transition-all duration-300", collapsed ? "gap-0" : "gap-2.5")}>
            <Logo collapsed={collapsed} imgClassName="h-7" />
            {!collapsed && (
              <div className="flex items-center gap-1.5 ml-1 transition-all duration-300">
                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse shrink-0", cfg.statusDot)} />
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider truncate"
                  style={{ color: cfg.accentColor }}
                >
                  {cfg.statusText}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onCollapsedChange && (
              <button
                onClick={() => onCollapsedChange(!collapsed)}
                className="hidden lg:grid h-7 w-7 place-items-center rounded-md text-fg-muted hover:bg-surface-2 transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            )}
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

          {/* Branch Selector */}
          {(() => {
            if (collapsed) {
              return (
                <div className="flex justify-center py-2 text-fg-subtle border-b border-white/5 mb-3" title={currentBranch?.name ?? "Branch"}>
                  <GitBranch className="h-4 w-4" />
                </div>
              );
            }

            const isBranchScoped = user?.role === "KITCHEN_STAFF" || user?.role === "WAITER";
            const hasMultiple = accessibleBranches && accessibleBranches.length > 1;

            return (
              <div className="mx-1 mb-4 p-2.5 rounded-xl border border-white/5 bg-surface-2/40 backdrop-blur-sm">
                <div className="mb-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Restaurant</div>
                  <div className="text-xs font-semibold text-fg truncate">{restaurantName || "Steward Restaurant"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mb-1">Active Branch</div>
                  {isBranchScoped || !hasMultiple ? (
                    // Static Branch Context
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-3/50 text-xs font-medium text-fg-muted border border-border">
                      <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="truncate">{currentBranch?.name ?? "Main Branch"}</span>
                    </div>
                  ) : (
                    // Multi-Branch Selector
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        disabled={isSwitchingBranch}
                        onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                        className="flex w-full items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-3/80 text-xs font-medium text-fg border border-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isSwitchingBranch ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent shrink-0" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                          )}
                          <span className="truncate">{currentBranch?.name ?? "Select Branch"}</span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-fg-subtle shrink-0" />
                      </button>

                      {branchDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.5)] max-h-48 overflow-y-auto scrollbar-thin">
                          <div className="p-1 space-y-0.5">
                            {accessibleBranches.map((br) => {
                              const isCurrent = br.id === currentBranch?.id;
                              return (
                                <button
                                  key={br.id}
                                  type="button"
                                  onClick={() => {
                                    setBranchDropdownOpen(false);
                                    if (br.id !== currentBranch?.id) {
                                      switchBranch(br.id);
                                    }
                                  }}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-left transition-colors",
                                    isCurrent
                                      ? "bg-accent/15 text-accent font-semibold"
                                      : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                                  )}
                                >
                                  <span className="truncate">{br.name}</span>
                                  {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Super Admin restaurant context banner */}
          {user?.role === "SUPER_ADMIN" && selectedRestaurant && !collapsed && (
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
                <SectionLabel collapsed={collapsed}>Home</SectionLabel>
                <ul className="space-y-0.5">
                  <NavLink href="/kitchen-home" label="Kitchen Home" icon={Home} onClose={onClose} accentColor={cfg.accentColor} collapsed={collapsed} />
                </ul>
              </div>
              <div className="mb-3">
                <SectionLabel collapsed={collapsed}>Kitchen</SectionLabel>
                <ul className="space-y-0.5">
                  {navKitchen.map((item) => (
                    <NavLink key={item.href} {...item} onClose={onClose} accentColor={cfg.accentColor} collapsed={collapsed} />
                  ))}
                </ul>
              </div>
              {canViewOrders && (
                <div className="mb-3">
                  <SectionLabel collapsed={collapsed}>Records</SectionLabel>
                  <ul className="space-y-0.5">
                    <NavLink href="/orders" label="Order History" icon={ShoppingCart} onClose={onClose} accentColor={cfg.accentColor} collapsed={collapsed} />
                  </ul>
                </div>
              )}
            </>
          )}

          {/* ── Waiter ──────────────────────────────────────── */}
          {isWaiter && (
            <>
              <div className="mb-3">
                <SectionLabel collapsed={collapsed}>Home</SectionLabel>
                <ul className="space-y-0.5">
                  <NavLink href="/waiter-home" label="Service Home" icon={Home} onClose={onClose} accentColor={cfg.accentColor} collapsed={collapsed} />
                </ul>
              </div>
              <div className="mb-3">
                <SectionLabel collapsed={collapsed}>Service</SectionLabel>
                <ul className="space-y-0.5">
                  {navWaiter.map((item) => (
                    <NavLink key={item.href} {...item} onClose={onClose} accentColor={cfg.accentColor} collapsed={collapsed} />
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ── Admin / Super Admin ──────────────────────────── */}
          {isAdmin && (
            <>
              <div className="mb-3">
                <SectionLabel collapsed={collapsed}>Management</SectionLabel>
                <ul className="space-y-0.5">
                  {navAdmin.map((item) => (
                    <NavLink key={item.href} {...item} onClose={onClose} collapsed={collapsed} />
                  ))}
                </ul>
              </div>

              {canUseKitchen && (
                <div className="mb-3">
                  <SectionLabel collapsed={collapsed}>Kitchen</SectionLabel>
                  <ul className="space-y-0.5">
                    {navKitchen.map((item) => (
                      <NavLink key={item.href} {...item} onClose={onClose} collapsed={collapsed} />
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-3">
                <SectionLabel collapsed={collapsed}>System</SectionLabel>
                <ul className="space-y-0.5">
                  <NavLink href="/settings" label="Settings" icon={Settings} onClose={onClose} collapsed={collapsed} />
                </ul>
              </div>
            </>
          )}
        </nav>

        {/* Profile footer */}
        <div className="border-t border-border p-2.5 shrink-0">
          <div className={cn(
            "flex items-center rounded-lg bg-surface-2 border border-border hover:border-border-strong transition-all duration-300 group",
            collapsed ? "flex-col justify-center gap-2.5 p-2" : "gap-2.5 px-2.5 py-2"
          )}>
            {/* Avatar with role-tint */}
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-[11px] font-semibold text-fg shrink-0 bg-surface-3"
            >
              {initials}
            </div>

            {/* Name & role */}
            {!collapsed && (
              <div className="min-w-0 flex-1 transition-all duration-300">
                <div className="truncate text-[12px] font-medium text-fg leading-tight">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="truncate text-[10px] mt-0.5" style={{ color: cfg.accentColor }}>{roleLabel}</div>
              </div>
            )}

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
