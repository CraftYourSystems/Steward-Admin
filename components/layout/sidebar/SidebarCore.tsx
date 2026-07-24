"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavItem, NavGroup } from "@/config/navigation";

// ─── Constants ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#090909",
  hover: "#151515",
  active: "#1C1C1C",
  border: "rgba(255,255,255,0.06)",
  muted: "rgba(255,255,255,0.55)",
  primary: "rgba(255,255,255,0.92)",
};

// ─── SidebarItem ────────────────────────────────────────────────────────────

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  accentColor?: string;
  isSubItem?: boolean;
}

export function SidebarItem({ item, collapsed, accentColor = "hsl(var(--accent))", isSubItem }: SidebarItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center rounded-lg text-[13.5px] font-medium transition-all duration-150 ease-in-out active:scale-[0.98]",
          collapsed 
            ? "h-[40px] w-[40px] justify-center px-0 mx-auto" 
            : "h-[38px] gap-2.5 px-3 mx-3 w-auto",
          active 
            ? "text-white shadow-sm"
            : "text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.92)]",
          isSubItem && !collapsed ? "pl-[18px]" : ""
        )}
        style={{
          backgroundColor: active ? COLORS.active : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = COLORS.hover;
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[55%] w-[3px] rounded-r-full"
            style={{ backgroundColor: accentColor }}
          />
        )}
        {Icon && (
          <Icon
            className={cn(
              "shrink-0 transition-all duration-150",
              collapsed ? "h-[18px] w-[18px]" : "h-[16px] w-[16px]",
              active ? "text-white" : "text-[rgba(255,255,255,0.45)] group-hover:text-[rgba(255,255,255,0.85)]",
              item.isSparkle && "text-amber-400/90 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
            )}
            style={active && !item.isSparkle ? { color: accentColor } : undefined}
          />
        )}
        <span
          className={cn(
            "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-150",
            collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100",
            item.isSparkle && "font-semibold text-amber-400/90 group-hover:text-amber-400"
          )}
          style={active && !item.isSparkle ? { fontWeight: 500 } : undefined}
        >
          {item.label}
        </span>
      </Link>
    </li>
  );
}

// ─── SidebarGroup ───────────────────────────────────────────────────────────

interface SidebarGroupProps {
  group: NavGroup;
  collapsed: boolean;
  accentColor?: string;
  userRole?: string;
}

export function SidebarGroup({ group, collapsed, accentColor, userRole }: SidebarGroupProps) {
  // Filter items by role
  const visibleItems = group.items.filter((item) => {
    if (!userRole) return false;
    return item.roles.includes(userRole as any);
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-3">
      {group.label && !collapsed && (
        <div
          className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.38)] px-6 mb-1 mt-2.5 transition-all duration-150"
        >
          {group.label}
        </div>
      )}
      <ul className="space-y-[3px]">
        {visibleItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            accentColor={accentColor}
            isSubItem={!!group.label}
          />
        ))}
      </ul>
    </div>
  );
}

// ─── SidebarProfile ─────────────────────────────────────────────────────────

interface SidebarProfileProps {
  collapsed: boolean;
  user: { firstName?: string | null; lastName?: string | null; role?: string | null; avatarUrl?: string | null } | null;
}

export function SidebarProfile({ collapsed, user }: SidebarProfileProps) {
  if (!user) return null;
  
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return (
    <div className="mt-auto px-3 py-3 border-t" style={{ borderColor: COLORS.border }}>
      <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center" : "px-2")}>
        <div className="h-[30px] w-[30px] shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white border border-white/5 shadow-sm">
          {initials || "?"}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[12.5px] font-semibold text-white truncate leading-tight">{name || "User"}</span>
            <span className="text-[10.5px] text-[rgba(255,255,255,0.45)] capitalize truncate leading-tight mt-0.5">
              {user.role?.replace("_", " ").toLowerCase() || "Role"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
