"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  formatDistanceToNow,
  format,
  subDays,
  subHours,
  isToday,
  isYesterday,
  differenceInDays,
} from "date-fns";
import {
  Filter,
  RefreshCw,
  ClipboardList,
  User,
  X,
  ChevronDown,
  LogIn,
  LogOut,
  ShoppingBag,
  UtensilsCrossed,
  Settings,
  UserCog,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Search,
  BookOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ApiSuccess, PaginationMeta } from "@/types";

interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

type BadgeVariant = "default" | "neutral" | "warning" | "info" | "success" | "danger" | "accent";

interface ActionConfig {
  variant: BadgeVariant;
  label: string;
  icon: React.ElementType;
  description?: (meta: Record<string, unknown> | null) => string | null;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  STAFF_LOGIN:           { variant: "success", label: "Logged in",         icon: LogIn,
    description: (m) => m?.device ? `via ${m.device}` : null },
  AUTH_LOGIN:            { variant: "success", label: "Logged in",         icon: LogIn },
  LOGIN:                 { variant: "success", label: "Logged in",         icon: LogIn },
  STAFF_LOGOUT:          { variant: "neutral", label: "Logged out",        icon: LogOut },
  AUTH_LOGOUT:           { variant: "neutral", label: "Logged out",        icon: LogOut },
  LOGOUT:                { variant: "neutral", label: "Logged out",        icon: LogOut },
  LOGIN_FAILED:          { variant: "danger",  label: "Login failed",      icon: ShieldAlert,
    description: (m) => m?.reason ? `Reason: ${m.reason}` : null },
  AUTH_FAILED:           { variant: "danger",  label: "Auth failed",       icon: ShieldAlert },
  PASSWORD_CHANGED:      { variant: "warning", label: "Password changed",  icon: ShieldAlert },
  PIN_RESET:             { variant: "warning", label: "PIN reset",         icon: ShieldAlert },

  ORDER_CREATED:         { variant: "info",    label: "Order created",     icon: ShoppingBag,
    description: (m) => m?.orderNumber ? `#${m.orderNumber}` : null },
  ORDER_STATUS_CHANGED:  { variant: "info",    label: "Status changed",    icon: ShoppingBag,
    description: (m) => m?.from && m?.to ? `${m.from} → ${m.to}` : null },
  ORDER_COMPLETED:       { variant: "success", label: "Order completed",   icon: CheckCircle2,
    description: (m) => m?.orderNumber ? `#${m.orderNumber}` : null },
  ORDER_CANCELLED:       { variant: "danger",  label: "Order cancelled",   icon: X,
    description: (m) => m?.reason ? `Reason: ${m.reason}` : null },
  ORDER_UNDO:            { variant: "warning", label: "Order undo",        icon: AlertTriangle,
    description: (m) => m?.from ? `Reverted from ${m.from}` : null },

  MENU_ITEM_CREATED:     { variant: "success", label: "Item added",        icon: UtensilsCrossed,
    description: (m) => m?.name ? `"${m.name}"` : null },
  MENU_ITEM_UPDATED:     { variant: "warning", label: "Item updated",      icon: UtensilsCrossed,
    description: (m) => m?.name ? `"${m.name}"` : null },
  MENU_ITEM_DELETED:     { variant: "danger",  label: "Item removed",      icon: UtensilsCrossed,
    description: (m) => m?.name ? `"${m.name}"` : null },
  ITEM_AVAILABILITY:     { variant: "warning", label: "Availability set",  icon: Tag,
    description: (m) => m?.available !== undefined ? (m.available ? "marked available" : "marked unavailable") : null },
  CATEGORY_CREATED:      { variant: "success", label: "Category added",    icon: Tag,
    description: (m) => m?.name ? `"${m.name}"` : null },
  CATEGORY_UPDATED:      { variant: "warning", label: "Category updated",  icon: Tag,
    description: (m) => m?.name ? `"${m.name}"` : null },
  CATEGORY_DELETED:      { variant: "danger",  label: "Category removed",  icon: Tag },

  STAFF_CREATED:         { variant: "success", label: "Staff added",       icon: User,
    description: (m) => m?.email ? String(m.email) : null },
  STAFF_UPDATED:         { variant: "info",    label: "Staff updated",     icon: UserCog,
    description: (m) => m?.email ? String(m.email) : null },
  STAFF_DELETED:         { variant: "danger",  label: "Staff removed",     icon: User,
    description: (m) => m?.email ? String(m.email) : null },
  STAFF_DEACTIVATED:     { variant: "danger",  label: "Staff deactivated", icon: User },
  STAFF_ACTIVATED:       { variant: "success", label: "Staff reactivated", icon: User },
  STAFF_INVITE_SENT:     { variant: "info",    label: "Invite sent",       icon: User,
    description: (m) => m?.email ? String(m.email) : null },

  SETTINGS_UPDATED:      { variant: "accent",  label: "Settings updated",  icon: Settings,
    description: (m) => m?.section ? `Section: ${m.section}` : null },
  RESTAURANT_UPDATED:    { variant: "accent",  label: "Restaurant updated", icon: Settings },
};

function getActionConfig(action: string): ActionConfig {
  if (ACTION_CONFIG[action]) return ACTION_CONFIG[action];
  const key = Object.keys(ACTION_CONFIG).find((k) => action.includes(k) || k.includes(action));
  if (key) return ACTION_CONFIG[key];
  return { variant: "neutral", label: action.replace(/_/g, " ").toLowerCase(), icon: ClipboardList };
}

function defaultFrom() {
  return format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm");
}

export function LogbookView() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<AuditEntry | null>(null);

  const [filters, setFilters] = useState({
    action: "",
    resourceType: "",
    actorId: "",
    from: defaultFrom(),
    to: "",
    page: 1,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 100 };
      if (filters.action)       params.action       = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.actorId)      params.actorId      = filters.actorId;
      if (filters.from)         params.from         = new Date(filters.from).toISOString();
      if (filters.to)           params.to           = new Date(filters.to).toISOString();

      const { data } = await api.get<ApiSuccess<AuditEntry[]> & { meta: PaginationMeta }>(
        "/audit",
        { params }
      );
      return data;
    },
    staleTime: 15_000,
  });

  const rawEntries = (data as any)?.data ?? [] as AuditEntry[];
  const meta = (data as any)?.meta as PaginationMeta | undefined;

  // Filter entries based on search & category locally
  const processedEntries = useMemo(() => {
    return rawEntries.filter((entry: AuditEntry) => {
      const actorName = entry.actorEmail ? entry.actorEmail.split("@")[0].toLowerCase() : "system";
      const actionName = entry.action.toLowerCase();
      const resource = (entry.resourceType || "").toLowerCase();
      const term = search.toLowerCase();

      const matchesSearch =
        actorName.includes(term) ||
        actionName.includes(term) ||
        resource.includes(term) ||
        JSON.stringify(entry.metadata || "").toLowerCase().includes(term);

      if (categoryFilter === "all") return matchesSearch;

      // Groupings
      if (categoryFilter === "orders" && entry.action.includes("ORDER")) return matchesSearch;
      if (categoryFilter === "kitchen" && entry.action.includes("KITCHEN")) return matchesSearch;
      if (categoryFilter === "menu" && (entry.action.includes("MENU") || entry.action.includes("CATEGORY") || entry.action.includes("AVAILABILITY"))) return matchesSearch;
      if (categoryFilter === "staff" && entry.action.includes("STAFF")) return matchesSearch;
      if (categoryFilter === "settings" && entry.action.includes("SETTINGS")) return matchesSearch;
      if (categoryFilter === "system" && !entry.actorEmail) return matchesSearch;

      return false;
    });
  }, [rawEntries, search, categoryFilter]);

  // Group events by Day
  const groupedEntries = useMemo(() => {
    const groups: Record<string, AuditEntry[]> = {
      "Today": [],
      "Yesterday": [],
      "Earlier This Week": [],
      "Older": []
    };

    processedEntries.forEach((entry: AuditEntry) => {
      const date = new Date(entry.createdAt);
      if (isToday(date)) {
        groups["Today"].push(entry);
      } else if (isYesterday(date)) {
        groups["Yesterday"].push(entry);
      } else if (differenceInDays(new Date(), date) <= 7) {
        groups["Earlier This Week"].push(entry);
      } else {
        groups["Older"].push(entry);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [processedEntries]);

  // Derived timeline statistics
  const { todayEvents, criticalEvents, staffActions, systemEvents, operationalStatus, statusDetail } = useMemo(() => {
    const todayCount = rawEntries.filter((e: AuditEntry) => isToday(new Date(e.createdAt))).length;
    const criticalCount = rawEntries.filter((e: AuditEntry) => ["LOGIN_FAILED", "ORDER_CANCELLED", "MENU_ITEM_DELETED"].includes(e.action)).length;
    const staffCount = rawEntries.filter((e: AuditEntry) => !!e.actorEmail).length;
    const systemCount = rawEntries.filter((e: AuditEntry) => !e.actorEmail).length;

    const status = criticalCount > 3 ? "Attention Needed" : todayCount > 25 ? "Busy" : "Normal";
    let detail = "Operating parameters within normal thresholds.";
    if (status === "Attention Needed") {
      detail = `${criticalCount} system exceptions require manager review.`;
    } else if (status === "Busy") {
      detail = "High transaction and kitchen staff logs throughput.";
    }

    return { todayEvents: todayCount, criticalEvents: criticalCount, staffActions: staffCount, systemEvents: systemCount, operationalStatus: status, statusDetail: detail };
  }, [rawEntries]);

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1.5 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs mb-1 font-semibold">Shift Journal</div>
          <h2 className="text-xl font-bold tracking-tight text-fg">Logbook Control</h2>
          <p className="text-[12px] text-fg-subtle mt-0.5 font-normal">
            Track chronological system journals, staff operations, and warnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-fg-muted hover:text-fg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary stats Ribbon */}
      {!isLoading && rawEntries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Today's Events</span>
            <span className="text-xl font-black text-fg num mt-1">{todayEvents}</span>
          </div>
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Critical Warning Events</span>
            <span className="text-xl font-black text-danger num mt-1">{criticalEvents}</span>
          </div>
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Staff Actions</span>
            <span className="text-xl font-black text-success num mt-1">{staffActions}</span>
          </div>
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">System Logs</span>
            <span className="text-xl font-black text-white/55 num mt-1">{systemEvents}</span>
          </div>
          <div className={cn("col-span-2 lg:col-span-1 flex flex-col p-4 rounded-2xl border justify-center", operationalStatus === "Normal" ? "border-success/20 bg-success/5 text-success" : operationalStatus === "Busy" ? "border-primary/20 bg-primary/5 text-primary" : "border-danger/20 bg-danger/5 text-danger")}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 select-none">Log Status</span>
              {operationalStatus === "Normal" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[15.5px] font-black tracking-tight mt-1">{operationalStatus.toUpperCase()}</span>
            <span className="text-[10px] opacity-75 mt-0.5 font-normal truncate">{statusDetail}</span>
          </div>
        </div>
      )}

      {/* Unified Search & Category Filtering Bar */}
      <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search log records by actor, action type, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
          >
            <option value="all">All Modules</option>
            <option value="orders">Orders</option>
            <option value="kitchen">Kitchen</option>
            <option value="menu">Menu & Catalog</option>
            <option value="staff">Staff Activity</option>
            <option value="settings">Settings</option>
            <option value="system">System Logs</option>
          </select>
        </div>
      </div>

      {/* Chronological timeline layout */}
      <div className="card-premium overflow-hidden border border-white/5 rounded-2xl bg-white/[0.01]">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md bg-white/5" />
            ))}
          </div>
        ) : rawEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] font-semibold text-fg">No operational history is available yet.</p>
            <p className="text-[11px] text-fg-subtle">Events will begin appearing as your restaurant is used.</p>
          </div>
        ) : processedEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] font-bold text-fg">No events match your current search.</p>
            <p className="text-[11px] text-fg-subtle">Try adjusting your search or clearing filters.</p>
            <Button size="sm" variant="secondary" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {groupedEntries.map(([dayLabel, events]) => (
              <div key={dayLabel} className="space-y-1 p-4 bg-transparent">
                <div className="text-[11px] font-black uppercase tracking-wider text-accent border-b border-white/5 pb-1 mb-3 select-none">
                  {dayLabel}
                </div>
                <div className="space-y-2">
                  {events.map((entry: AuditEntry) => {
                    const cfg = getActionConfig(entry.action);
                    const Icon = cfg.icon;
                    const actorName = entry.actorEmail ? entry.actorEmail.split("@")[0] : "System";
                    const desc = cfg.description?.(entry.metadata) ?? entry.resourceType;

                    return (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedEvent(entry)}
                        className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer text-[12.5px]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={cn("p-2 rounded-lg shrink-0", cfg.variant === "success" ? "bg-success/15 text-success" : cfg.variant === "danger" ? "bg-danger/15 text-danger" : cfg.variant === "warning" ? "bg-warning/15 text-warning" : "bg-white/5 text-fg-muted")}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-fg truncate">{cfg.label}</span>
                            <span className="text-[10.5px] text-fg-subtle mt-0.5 truncate">
                              Actor: {actorName} • {desc}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-fg/80 num text-[11px] block">{format(new Date(entry.createdAt), "HH:mm")}</span>
                          <span className="text-[9.5px] text-white/20 mt-0.5 block">{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Event Detail Drawer ── */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        {selectedEvent && (
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg space-y-6">
            <SheetHeader className="pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                <SheetTitle className="text-fg font-black text-lg">Event Journal Details</SheetTitle>
              </div>
            </SheetHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Event Action</span>
                <span className="text-md font-extrabold text-white block">{getActionConfig(selectedEvent.action).label}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Actor / Performer</span>
                <span className="text-[13px] font-semibold text-fg block">{selectedEvent.actorEmail || "System Automation"}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Timestamp</span>
                <span className="text-[12.5px] text-fg-muted font-mono num block">{format(new Date(selectedEvent.createdAt), "yyyy-MM-dd HH:mm:ss")}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Module Area</span>
                <span className="text-[12px] font-semibold text-fg uppercase px-2 py-0.5 bg-white/5 rounded border border-white/5 inline-block">
                  {selectedEvent.resourceType || "System"}
                </span>
              </div>

              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Event Metadata</span>
                  <div className="p-3 bg-black/35 border border-white/5 rounded-xl space-y-2">
                    {Object.entries(selectedEvent.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start text-[11px] gap-4">
                        <span className="text-fg-subtle shrink-0 capitalize">{key.replace(/_/g, " ")}:</span>
                        <span className="font-mono text-white text-right break-all">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
