"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart, UtensilsCrossed, Users,
  LogOut, X, Settings, ToggleLeft, WifiOff, Kanban,
  Soup, ClipboardList, BanknoteIcon, Home, ArrowLeft,
  Megaphone, PackageOpen, Sparkles, Activity,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, MapPin, Loader2, GitBranch,
  Menu as MenuIcon, Briefcase, LayoutDashboard
} from "lucide-react";
import { usePlatformStore } from "@/stores/platform.store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/stores/settings.store";
import { hasPermission, Permissions } from "@/lib/permissions/permissions";

// ─── Nav definitions ────────────────────────────────────────────────────────

const navOverview = [
  { href: "/dashboard",    label: "Overview",     icon: LayoutDashboard },
  { href: "/live-counter", label: "Live Counter", icon: Activity },
  { href: "/needle",       label: "Needle AI",    icon: Sparkles },
];

const navOperations = [
  { href: "/orders",               label: "Orders",         icon: ShoppingCart },
  { href: "/pay-at-counter",       label: "Pay at Counter", icon: BanknoteIcon },
  { href: "/kitchen",              label: "Kitchen Board",  icon: Kanban },
  { href: "/kitchen/availability", label: "Availability",   icon: ToggleLeft },
  { href: "/menu",                 label: "Menu",           icon: MenuIcon },
  { href: "/inventory",            label: "Inventory",      icon: PackageOpen },
];

const navBusiness = [
  { href: "/finance",   label: "Finance",   icon: BanknoteIcon },
  { href: "/reports",   label: "Reports",   icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users },
];

const navTeam = [
  { href: "/staff",   label: "Staff",   icon: Users },
  { href: "/logbook", label: "Logbook", icon: ClipboardList },
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
  ADMIN:         { logoGlow: "rgba(255,255,255,0.2)", logoBg: "bg-white",      logoText: "text-black", statusDot: "bg-white",    statusText: "Admin Mode",     accentColor: "#ffffff" },
  SUPER_ADMIN:   { logoGlow: "rgba(255,255,255,0.2)", logoBg: "bg-white",      logoText: "text-black", statusDot: "bg-white",    statusText: "Super Admin",    accentColor: "#ffffff" },
  KITCHEN_STAFF: { logoGlow: "rgba(217,184,114,0.3)", logoBg: "bg-[#D9B872]",  logoText: "text-black", statusDot: "bg-[#D9B872]", statusText: "Kitchen Active", accentColor: "#D9B872" },
  WAITER:        { logoGlow: "rgba(59,130,246,0.3)",  logoBg: "bg-info",       logoText: "text-white", statusDot: "bg-info",      statusText: "On Floor",       accentColor: "hsl(217,91%,60%)" },
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
          "group relative flex items-center h-10 rounded-xl text-[13.5px] font-medium transition-all duration-300 ease-out active:scale-[0.98]",
          collapsed ? "justify-center gap-0 px-0 w-10 mx-auto" : "gap-3 px-3 mx-2 w-auto",
          active
            ? "bg-surface-3/50 text-fg shadow-sm border border-white/5"
            : "text-fg-muted hover:bg-surface-2/60 hover:text-fg border border-transparent"
        )}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: accentColor ?? "hsl(var(--accent))", color: accentColor ?? "hsl(var(--accent))" }}
          />
        )}
        <Icon
          className={cn("h-4 w-4 shrink-0 transition-all duration-300", active ? "scale-110" : "text-fg-subtle group-hover:text-fg")}
          style={active ? { color: accentColor ?? "hsl(var(--accent))" } : undefined}
        />
        <span
          className={cn(
            "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            active && !collapsed && "font-semibold translate-x-0.5"
          )}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}

// ─── Collapsible Category Header ──────────────────────────────────────────────

function CollapsibleCategory({
  label,
  icon: Icon,
  collapsed,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  if (collapsed) {
    return <ul className="space-y-1">{children}</ul>;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-[calc(100%-16px)] mx-2 items-center justify-between h-10 px-3 rounded-xl text-[13.5px] font-medium text-fg-muted hover:bg-surface-2/60 hover:text-fg transition-all duration-300 group cursor-pointer border border-transparent"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="h-4 w-4 shrink-0 text-fg-subtle group-hover:text-fg transition-colors" />
          <span className="min-w-0 overflow-hidden whitespace-nowrap">{label}</span>
        </div>
        <ChevronRight
          className={cn("h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-300", isOpen && "rotate-90")}
        />
      </button>
      <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <ul className="pl-3 space-y-1 border-l border-white/10 ml-6 pb-1">{children}</ul>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children, collapsed = false }: { children: React.ReactNode; collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "text-[10px] font-bold uppercase tracking-widest text-fg-subtle transition-all duration-300",
        collapsed ? "h-0 opacity-0 overflow-hidden m-0" : "px-5 mt-5 mb-2 opacity-100"
      )}
    >
      {children}
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
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverSuppressed, setIsHoverSuppressed] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isBusinessActive = ["/finance", "/marketing", "/reports", "/customers"].some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  const isTeamActive = ["/staff", "/logbook"].some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const [businessOpen, setBusinessOpen] = useState(isBusinessActive);
  const [teamOpen, setTeamOpen] = useState(isTeamActive);

  useEffect(() => {
    if (isBusinessActive) setBusinessOpen(true);
  }, [isBusinessActive]);

  useEffect(() => {
    if (isTeamActive) setTeamOpen(true);
  }, [isTeamActive]);

  const handleMouseEnter = () => {
    if (isHoverSuppressed) return; // Prevent expansion if recently collapsed
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
    // DO NOT reset isHoverSuppressed here to prevent glitchy re-expansion during collapse
  };

  const handleToggleCollapse = () => {
    if (!onCollapsedChange) return;
    const nextCollapsed = !collapsed;
    if (nextCollapsed) {
      setIsHovered(false);
      setIsHoverSuppressed(true); // Suppress hover immediately on close click
      // Wait for the complete shrink animation before allowing hover again
      setTimeout(() => {
        setIsHoverSuppressed(false);
      }, 500);
    } else {
      setIsHoverSuppressed(false);
    }
    onCollapsedChange(nextCollapsed);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

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
  const canViewOrders = hasPermission(user?.role, Permissions.ORDER_VIEW);

  const cfg = ROLE_CONFIGS[user?.role ?? "ADMIN"] ?? ROLE_CONFIGS.ADMIN;

  const effectiveCollapsed = collapsed && (!isHovered || isHoverSuppressed);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Desktop spacer */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-[width] duration-300 ease-out",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      />

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col",
          "transition-[width,transform,box-shadow,background-color] duration-300 ease-out",
          "border-r",
          effectiveCollapsed 
            ? "w-[72px] bg-bg border-white/5" 
            : "w-[260px] bg-bg/95 backdrop-blur-xl border-border/50",
          collapsed && isHovered && !isHoverSuppressed 
            ? "shadow-[8px_0_40px_rgba(0,0,0,0.4)] bg-bg/95 backdrop-blur-xl border-border" 
            : "",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className={cn(
          "flex h-16 items-center shrink-0 transition-all duration-300 border-b border-border/50",
          effectiveCollapsed ? "justify-center px-0" : "justify-between px-5"
        )}>
          <div className={cn("flex items-center transition-all duration-300", effectiveCollapsed ? "gap-0" : "gap-3 min-w-0")}>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-all duration-300", 
                cfg.logoBg,
                !effectiveCollapsed && "shadow-lg"
              )}
              style={{ boxShadow: !effectiveCollapsed ? `0 4px 16px ${cfg.logoGlow}` : undefined }}
            >
              <span className={cn("text-[14px] font-bold", cfg.logoText ?? "text-white")}>S</span>
            </div>
            
            <div className={cn("min-w-0 overflow-hidden leading-none transition-all duration-300", effectiveCollapsed ? "w-0 opacity-0" : "w-[120px] opacity-100")}>
              <div className="text-[14px] font-bold text-fg tracking-tight">Steward</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-bold uppercase tracking-widest truncate" style={{ color: cfg.accentColor }}>
                  {cfg.statusText}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {onCollapsedChange && !effectiveCollapsed && (
              <button
                onClick={handleToggleCollapse}
                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg transition-all active:scale-95"
                title={collapsed ? "Pin sidebar open" : "Unpin sidebar (auto-collapse)"}
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 transition-all active:scale-95"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-none space-y-1">

          {/* Branch Selector */}
          {(() => {
            if (effectiveCollapsed) {
              return (
                <div className="flex justify-center pb-4 text-fg-subtle border-b border-white/5 mb-2" title={currentBranch?.name ?? "Branch"}>
                  <GitBranch className="h-4 w-4" />
                </div>
              );
            }

            const isBranchScoped = user?.role === "KITCHEN_STAFF" || user?.role === "WAITER";
            const hasMultiple = accessibleBranches && accessibleBranches.length > 1;

            if (!hasMultiple && !isBranchScoped) return null;

            return (
              <div className="mx-4 mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle mb-2">Branch</div>
                {isBranchScoped || !hasMultiple ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2/50 text-[13px] font-medium text-fg-muted border border-border">
                    <MapPin className="h-4 w-4 text-accent shrink-0" />
                    <span className="truncate">{currentBranch?.name ?? "Main Branch"}</span>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      disabled={isSwitchingBranch}
                      onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-[13px] font-medium text-fg border border-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSwitchingBranch ? (
                          <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
                        ) : (
                          <MapPin className="h-4 w-4 text-accent shrink-0" />
                        )}
                        <span className="truncate">{currentBranch?.name ?? "Select Branch"}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-fg-subtle shrink-0" />
                    </button>

                    {branchDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-h-48 overflow-y-auto scrollbar-thin backdrop-blur-xl">
                        <div className="p-1.5 space-y-0.5">
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
                                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-left transition-colors",
                                  isCurrent
                                    ? "bg-accent/10 text-accent font-semibold"
                                    : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                                )}
                              >
                                <span className="truncate">{br.name}</span>
                                {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_currentColor]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Super Admin context banner */}
          {user?.role === "SUPER_ADMIN" && selectedRestaurant && !effectiveCollapsed && (
            <div className="mx-4 mb-4 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 shadow-inner">
              <p className="text-[10px] font-bold text-violet-400/80 uppercase tracking-widest mb-1">Viewing Restaurant</p>
              <p className="text-[13px] font-bold text-fg truncate">{selectedRestaurant.name}</p>
              <button
                onClick={() => {
                  exitRestaurant();
                  router.push("/platform");
                }}
                className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Platform
              </button>
            </div>
          )}

          {/* ── Kitchen Navigation ──────────────────────── */}
          {isKitchen && (
            <>
              <SectionLabel collapsed={effectiveCollapsed}>Overview</SectionLabel>
              <ul className="space-y-1">
                <NavLink href="/kitchen-home" label="Dashboard" icon={Home} onClose={onClose} accentColor={cfg.accentColor} collapsed={effectiveCollapsed} />
              </ul>
              <SectionLabel collapsed={effectiveCollapsed}>Operations</SectionLabel>
              <ul className="space-y-1">
                {navKitchen.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} accentColor={cfg.accentColor} collapsed={effectiveCollapsed} />
                ))}
              </ul>
              {canViewOrders && (
                <>
                  <SectionLabel collapsed={effectiveCollapsed}>Records</SectionLabel>
                  <ul className="space-y-1">
                    <NavLink href="/orders" label="Order History" icon={ShoppingCart} onClose={onClose} accentColor={cfg.accentColor} collapsed={effectiveCollapsed} />
                  </ul>
                </>
              )}
            </>
          )}

          {/* ── Waiter Navigation ─────────────────────────────── */}
          {isWaiter && (
            <>
              <SectionLabel collapsed={effectiveCollapsed}>Overview</SectionLabel>
              <ul className="space-y-1">
                <NavLink href="/waiter-home" label="Service Home" icon={Home} onClose={onClose} accentColor={cfg.accentColor} collapsed={effectiveCollapsed} />
              </ul>
              <SectionLabel collapsed={effectiveCollapsed}>Service</SectionLabel>
              <ul className="space-y-1">
                {navWaiter.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} accentColor={cfg.accentColor} collapsed={effectiveCollapsed} />
                ))}
              </ul>
            </>
          )}

          {/* ── Admin Navigation ────────────────── */}
          {isAdmin && (
            <div className="space-y-1">
              <SectionLabel collapsed={effectiveCollapsed}>Overview</SectionLabel>
              <ul className="space-y-1">
                {navOverview.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} collapsed={effectiveCollapsed} />
                ))}
              </ul>

              <SectionLabel collapsed={effectiveCollapsed}>Operations</SectionLabel>
              <ul className="space-y-1">
                {navOperations.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} collapsed={effectiveCollapsed} />
                ))}
              </ul>

              <SectionLabel collapsed={effectiveCollapsed}>Management</SectionLabel>
              <CollapsibleCategory
                label="Business"
                icon={Briefcase}
                collapsed={effectiveCollapsed}
                isOpen={businessOpen}
                onToggle={() => setBusinessOpen((prev) => !prev)}
              >
                {navBusiness.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} collapsed={effectiveCollapsed} />
                ))}
              </CollapsibleCategory>

              <CollapsibleCategory
                label="Team"
                icon={Users}
                collapsed={effectiveCollapsed}
                isOpen={teamOpen}
                onToggle={() => setTeamOpen((prev) => !prev)}
              >
                {navTeam.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} collapsed={effectiveCollapsed} />
                ))}
              </CollapsibleCategory>

              <div className="h-px bg-border/50 my-3 mx-4" />

              <ul className="space-y-1">
                <NavLink href="/settings" label="Settings" icon={Settings} onClose={onClose} collapsed={effectiveCollapsed} />
              </ul>
            </div>
          )}
        </nav>

        {/* Profile & Status Footer */}
        <div className="p-3 border-t border-border/50 bg-surface-1/30 shrink-0">
          <div className={cn(
            "flex items-center rounded-xl transition-all duration-300 border border-transparent",
            effectiveCollapsed 
              ? "flex-col justify-center gap-0 p-1" 
              : "gap-3 px-3 py-2.5 bg-surface-2/40 hover:bg-surface-3/60 hover:border-white/5 cursor-pointer shadow-sm"
          )}>
            {/* Avatar & Online Dot */}
            <div className="relative shrink-0 flex items-center justify-center">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[12px] font-bold text-white bg-gradient-to-b from-surface-3 to-surface-2"
                style={{ boxShadow: !effectiveCollapsed ? `0 2px 10px ${cfg.logoGlow}` : undefined }}
              >
                {initials}
              </div>
              <div 
                className={cn(
                  "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-bg transition-colors",
                  wsConnected ? "bg-emerald-500" : "bg-zinc-500"
                )}
                title={wsConnected ? "System Online" : "System Offline"}
              />
            </div>

            {/* Expanded Content */}
            {!effectiveCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-fg leading-tight">
                    {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "User Profile"}
                  </div>
                  <div className="truncate text-[11px] font-medium mt-0.5 text-fg-subtle">{roleLabel}</div>
                </div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-fg-subtle hover:bg-danger/10 hover:text-danger transition-colors shrink-0 active:scale-95"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

