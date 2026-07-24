"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Loader2,
  GitBranch,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformStore } from "@/stores/platform.store";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/config/navigation";
import { SidebarGroup, SidebarProfile } from "./sidebar/SidebarCore";

const ROLE_CONFIGS: Record<string, {
  logoGlow: string;
  logoBg: string;
  logoText?: string;
  statusText: string;
  accentColor: string;
}> = {
  ADMIN:         { logoGlow: "rgba(255,255,255,0.2)", logoBg: "bg-white",      logoText: "text-black", statusText: "Admin Mode",     accentColor: "#ffffff" },
  SUPER_ADMIN:   { logoGlow: "rgba(255,255,255,0.2)", logoBg: "bg-white",      logoText: "text-black", statusText: "Super Admin",    accentColor: "#ffffff" },
  KITCHEN_STAFF: { logoGlow: "rgba(217,184,114,0.3)", logoBg: "bg-[#D9B872]",  logoText: "text-black", statusText: "Kitchen Active", accentColor: "#D9B872" },
  WAITER:        { logoGlow: "rgba(59,130,246,0.3)",  logoBg: "bg-info",       logoText: "text-white", statusText: "On Floor",       accentColor: "hsl(217,91%,60%)" },
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ open, onClose, collapsed = false, onCollapsedChange }: SidebarProps) {
  const { user, currentBranch, accessibleBranches, isSwitchingBranch, switchBranch, logout } = useAuth();
  
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverSuppressed, setIsHoverSuppressed] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (isHoverSuppressed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const handleToggleCollapse = () => {
    if (!onCollapsedChange) return;
    const nextCollapsed = !collapsed;
    if (nextCollapsed) {
      setIsHovered(false);
      setIsHoverSuppressed(true);
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
          "hidden lg:block shrink-0 transition-[width] duration-150 ease-out",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      />

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col",
          "transition-[width,transform,box-shadow,background-color] duration-150 ease-out",
          "border-r",
          effectiveCollapsed 
            ? "w-[72px] bg-[#090909] border-[rgba(255,255,255,0.06)]" 
            : "w-[260px] bg-[#090909] border-[rgba(255,255,255,0.06)]",
          collapsed && isHovered && !isHoverSuppressed 
            ? "shadow-[8px_0_40px_rgba(0,0,0,0.4)]" 
            : "",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className={cn(
          "flex h-16 items-center shrink-0 transition-all duration-150",
          effectiveCollapsed ? "justify-center px-0" : "justify-between px-5"
        )}>
          <div className={cn("flex items-center transition-all duration-150", effectiveCollapsed ? "gap-0" : "gap-3 min-w-0")}>
            <div
              className={cn(
                "flex h-[28px] w-[28px] items-center justify-center rounded-lg shrink-0 transition-all duration-150", 
                cfg.logoBg
              )}
            >
              <span className={cn("text-[13px] font-bold", cfg.logoText ?? "text-white")}>S</span>
            </div>
            
            <div className={cn("min-w-0 overflow-hidden leading-none transition-all duration-150", effectiveCollapsed ? "w-0 opacity-0" : "w-[120px] opacity-100")}>
              <div className="text-[14px] font-semibold text-[rgba(255,255,255,0.92)] tracking-tight">Steward</div>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {onCollapsedChange && !effectiveCollapsed && (
              <button
                onClick={handleToggleCollapse}
                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(255,255,255,0.55)] hover:bg-[#151515] hover:text-white transition-all"
              >
                {collapsed ? <PanelLeftOpen className="h-[15px] w-[15px]" /> : <PanelLeftClose className="h-[15px] w-[15px]" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(255,255,255,0.55)] hover:bg-[#151515] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-none space-y-1">

          {/* Branch Selector */}
          {(() => {
            if (effectiveCollapsed) return null;
            const isBranchScoped = user?.role === "KITCHEN_STAFF" || user?.role === "WAITER";
            const hasMultiple = accessibleBranches && accessibleBranches.length > 1;
            if (!hasMultiple && !isBranchScoped) return null;

            return (
              <div className="px-5 mb-4 mt-2">
                {isBranchScoped || !hasMultiple ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#151515] text-[13px] font-medium text-[rgba(255,255,255,0.55)] border border-[rgba(255,255,255,0.06)]">
                    <MapPin className="h-[14px] w-[14px] text-accent shrink-0" />
                    <span className="truncate">{currentBranch?.name ?? "Main Branch"}</span>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      disabled={isSwitchingBranch}
                      onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#151515] hover:bg-[#1C1C1C] text-[13px] font-medium text-white border border-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSwitchingBranch ? (
                          <Loader2 className="h-[14px] w-[14px] animate-spin text-accent shrink-0" />
                        ) : (
                          <MapPin className="h-[14px] w-[14px] text-accent shrink-0" />
                        )}
                        <span className="truncate">{currentBranch?.name ?? "Select Branch"}</span>
                      </div>
                    </button>

                    {branchDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#090909] shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-1 space-y-0.5">
                          {accessibleBranches.map((br) => {
                            const isCurrent = br.id === currentBranch?.id;
                            return (
                              <button
                                key={br.id}
                                onClick={() => {
                                  if (!isCurrent) switchBranch(br.id);
                                  setBranchDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                                  isCurrent ? "bg-[#1C1C1C] text-white" : "text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-[#151515]"
                                )}
                              >
                                {br.name}
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

          {/* Core Navigation Groups */}
          {navigationConfig.map((group, idx) => (
            <SidebarGroup
              key={group.label || idx}
              group={group}
              collapsed={effectiveCollapsed}
              accentColor={cfg.accentColor}
              userRole={user?.role}
            />
          ))}

          {/* Sign Out Button (Not in config as it's an action) */}
          <div className="mt-2 mb-2">
            <button
              onClick={logout}
              className={cn(
                "group relative flex items-center rounded-xl text-[14.5px] font-medium transition-all duration-150 ease-in-out hover:bg-[#151515] active:scale-[0.98] h-[44px]",
                effectiveCollapsed ? "justify-center gap-0 px-0 w-11 mx-auto" : "gap-3 px-3 mx-3 w-[calc(100%-24px)] text-[rgba(255,255,255,0.55)] hover:text-red-400"
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 text-[rgba(255,255,255,0.55)] group-hover:text-red-400" />
              <span className={cn(
                "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-150",
                effectiveCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                Sign out
              </span>
            </button>
          </div>

        </nav>

        {/* Profile Area */}
        <SidebarProfile collapsed={effectiveCollapsed} user={user} />
      </aside>
    </>
  );
}
