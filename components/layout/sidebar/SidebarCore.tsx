"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { NavItem, NavGroup } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";

// ─── Constants ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#090909",
  hover: "#151515",
  active: "#1C1C1C",
  border: "rgba(255,255,255,0.06)",
  muted: "rgba(255,255,255,0.55)",
  primary: "rgba(255,255,255,0.92)",
};

const SPACING = {
  itemHeight: "h-[44px]",
  indent: "pl-[20px]",
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
          "group relative flex items-center rounded-xl text-[14.5px] font-medium transition-all duration-150 ease-in-out active:scale-[0.98]",
          SPACING.itemHeight,
          collapsed ? "justify-center gap-0 px-0 w-11 mx-auto" : "gap-3 px-3 mx-3 w-auto",
          active 
            ? "text-white shadow-sm"
            : "text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.92)]",
          isSubItem && !collapsed ? SPACING.indent : ""
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
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[3px] rounded-r-full"
            style={{ backgroundColor: accentColor }}
          />
        )}
        {Icon && (
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-all duration-150",
              active ? "text-white" : "text-[rgba(255,255,255,0.55)] group-hover:text-[rgba(255,255,255,0.92)]",
              item.isSparkle && "text-amber-400/90 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
            )}
            style={active && !item.isSparkle ? { color: accentColor } : undefined}
          />
        )}
        <span
          className={cn(
            "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-150",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            item.isSparkle && "font-semibold text-amber-500/90 group-hover:text-amber-400"
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
    <div className="mb-6">
      {group.label && (
        <div
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)] transition-all duration-150",
            collapsed ? "h-0 opacity-0 overflow-hidden m-0" : "px-6 mb-2 opacity-100"
          )}
        >
          {group.label}
        </div>
      )}
      <ul className="space-y-[2px]">
        {visibleItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            accentColor={accentColor}
            isSubItem={!!group.label && !item.icon}
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
    <div className="mt-auto px-4 pb-6 pt-4 border-t" style={{ borderColor: COLORS.border }}>
      <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
        <div className="h-9 w-9 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[12px] font-bold text-white border border-white/5 shadow-sm">
          {initials || "?"}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-white truncate">{name || "User"}</span>
            <span className="text-[11px] text-[rgba(255,255,255,0.55)] capitalize truncate">
              {user.role?.replace("_", " ").toLowerCase() || "Role"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
