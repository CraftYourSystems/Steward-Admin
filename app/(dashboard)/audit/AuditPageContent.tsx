"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import {
  formatDistanceToNow, format, subDays, subHours,
  parseISO, differenceInMinutes,
} from "date-fns";
import {
  Filter, RefreshCw, ClipboardList, User, X,
  ChevronDown, LogIn, LogOut, ShoppingBag, UtensilsCrossed,
  Settings, UserCog, ShieldAlert, AlertTriangle, CheckCircle2,
  Clock, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ApiSuccess, PaginationMeta } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface FiltersState {
  action: string;
  resourceType: string;
  actorId: string;
  from: string;
  to: string;
  page: number;
}

// ─── Action badge config ──────────────────────────────────────────────────────
// Covers all event types the backend may emit.

type BadgeVariant = "default" | "neutral" | "warning" | "info" | "success" | "danger" | "accent";

interface ActionConfig {
  variant: BadgeVariant;
  label: string;
  icon: React.ElementType;
  description?: (meta: Record<string, unknown> | null) => string | null;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  // ── Authentication ──────────────────────────────────────────────────────
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

  // ── Orders ──────────────────────────────────────────────────────────────
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

  // ── Menu ────────────────────────────────────────────────────────────────
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

  // ── Staff ───────────────────────────────────────────────────────────────
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

  // ── Settings ────────────────────────────────────────────────────────────
  SETTINGS_UPDATED:      { variant: "accent",  label: "Settings updated",  icon: Settings,
    description: (m) => m?.section ? `Section: ${m.section}` : null },
  RESTAURANT_UPDATED:    { variant: "accent",  label: "Restaurant updated", icon: Settings },
};

function getActionConfig(action: string): ActionConfig {
  if (ACTION_CONFIG[action]) return ACTION_CONFIG[action];
  // Fuzzy fallback: try to find a partial match
  const key = Object.keys(ACTION_CONFIG).find((k) => action.includes(k) || k.includes(action));
  if (key) return ACTION_CONFIG[key];
  // Generic fallback
  return { variant: "neutral", label: action.replace(/_/g, " ").toLowerCase(), icon: ClipboardList };
}

// ─── Grouped staff activity summary ──────────────────────────────────────────

interface StaffActivity {
  email: string;
  actorId: string | null;
  count: number;
  lastSeen: string;
  loginCount: number;
}

function buildStaffSummary(entries: AuditEntry[]): StaffActivity[] {
  const map: Record<string, StaffActivity> = {};
  for (const e of entries) {
    if (!e.actorEmail) continue;
    if (!map[e.actorEmail]) {
      map[e.actorEmail] = { email: e.actorEmail, actorId: e.actorId, count: 0, lastSeen: e.createdAt, loginCount: 0 };
    }
    map[e.actorEmail].count++;
    if (["STAFF_LOGIN", "AUTH_LOGIN", "LOGIN"].includes(e.action)) {
      map[e.actorEmail].loginCount++;
    }
    if (new Date(e.createdAt) > new Date(map[e.actorEmail].lastSeen)) {
      map[e.actorEmail].lastSeen = e.createdAt;
    }
  }
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ActorAvatar({ email }: { email: string | null }) {
  if (!email) return (
    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-surface-3 border border-border grid place-items-center">
      <User className="h-3.5 w-3.5 text-fg-subtle" />
    </div>
  );
  const initials = email.split("@")[0].slice(0, 2).toUpperCase();
  return (
    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-accent/15 border border-accent/25 grid place-items-center">
      <span className="text-[10px] font-bold text-accent">{initials}</span>
    </div>
  );
}

// ─── Expandable metadata detail ───────────────────────────────────────────────

function MetadataDetail({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const entries = Object.entries(metadata).filter(([, v]) =>
    v !== null && v !== undefined && v !== ""
  );
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 pl-2 border-l-2 border-border space-y-0.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="text-[10px] text-fg-subtle uppercase tracking-wide min-w-[80px] shrink-0">
            {key.replace(/_/g, " ")}
          </span>
          <span className="text-[10px] text-fg font-mono break-all">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Single log row ───────────────────────────────────────────────────────────

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cfg     = getActionConfig(entry.action);
  const IconCmp = cfg.icon;
  const actorName = entry.actorEmail
    ? entry.actorEmail.split("@")[0]
    : "System";

  const extraDescription = cfg.description?.(entry.metadata) ?? null;
  const hasMetadata = !!entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <div
      className={cn(
        "border-b border-border last:border-0 transition-colors",
        expanded ? "bg-surface-2/40" : "hover:bg-surface-2/30"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3 px-4 py-3",
          hasMetadata && "cursor-pointer"
        )}
        onClick={() => hasMetadata && setExpanded((v) => !v)}
        role={hasMetadata ? "button" : undefined}
        tabIndex={hasMetadata ? 0 : undefined}
        onKeyDown={(e) => hasMetadata && e.key === "Enter" && setExpanded((v) => !v)}
        aria-expanded={hasMetadata ? expanded : undefined}
      >
        {/* Avatar */}
        <ActorAvatar email={entry.actorEmail} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold text-fg">{actorName}</span>
            <Badge variant={cfg.variant} className="inline-flex items-center gap-1 text-[9px]">
              <IconCmp className="h-2.5 w-2.5" />
              {cfg.label}
            </Badge>
            {extraDescription && (
              <span className="text-[11px] text-fg-muted font-mono">{extraDescription}</span>
            )}
            {entry.resourceType && (
              <span className="text-[10px] text-fg-subtle/60 bg-surface-3 rounded px-1 py-0.5">
                {entry.resourceType}
              </span>
            )}
          </div>

          {/* Actor email + IP */}
          <div className="mt-0.5 text-[11px] text-fg-subtle flex items-center gap-2">
            <span>{entry.actorEmail ?? "system"}</span>
            {entry.ipAddress && (
              <span className="font-mono text-[10px] opacity-50">{entry.ipAddress}</span>
            )}
          </div>

          {/* Expanded metadata */}
          {expanded && hasMetadata && (
            <MetadataDetail metadata={entry.metadata} />
          )}
        </div>

        {/* Right: timestamp + expand chevron */}
        <div className="flex items-start gap-2 flex-shrink-0 pt-0.5">
          <div className="text-right">
            <p className="text-[11px] text-fg-muted">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </p>
            <p className="text-[10px] text-fg-subtle mt-0.5">
              {format(new Date(entry.createdAt), "MMM d, HH:mm")}
            </p>
          </div>
          {hasMetadata && (
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-fg-subtle mt-0.5 transition-transform shrink-0",
              expanded && "rotate-180"
            )} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Staff summary card ───────────────────────────────────────────────────────

function StaffSummaryCard({
  activity,
  onFilter,
}: {
  activity: StaffActivity;
  onFilter: (actorId: string, email: string) => void;
}) {
  const initials = activity.email.split("@")[0].slice(0, 2).toUpperCase();
  return (
    <button
      onClick={() => onFilter(activity.actorId ?? activity.email, activity.email)}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 hover:bg-surface-2 hover:border-border-strong transition-all text-left w-full"
    >
      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-accent/15 border border-accent/25 grid place-items-center">
        <span className="text-[10px] font-bold text-accent">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-fg truncate">
          {activity.email.split("@")[0]}
        </p>
        <p className="text-[10px] text-fg-subtle">
          {activity.count} action{activity.count !== 1 ? "s" : ""}
          {activity.loginCount > 0 && ` · ${activity.loginCount} login${activity.loginCount !== 1 ? "s" : ""}`}
        </p>
      </div>
      <span className="text-[10px] text-fg-subtle shrink-0">
        {formatDistanceToNow(new Date(activity.lastSeen), { addSuffix: true })}
      </span>
    </button>
  );
}

// ─── Default time range: 7 days (was 24 h — too short for login history) ──────

function defaultFrom() {
  return format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditPageContent() {
  const searchParams = useSearchParams();
  const presetActorId    = searchParams.get("actorId")    ?? "";
  const presetActorEmail = searchParams.get("actorEmail") ?? "";

  const [filters, setFilters] = useState<FiltersState>({
    action:       "",
    resourceType: "",
    actorId:      presetActorId,
    from:         defaultFrom(),
    to:           "",
    page:         1,
  });
  const [showFilters,  setShowFilters]  = useState(false);
  const [showSummary,  setShowSummary]  = useState(true);

  // Auto-open filters when a staff member is pre-selected via URL.
  useEffect(() => {
    if (presetActorId) setShowFilters(true);
  }, [presetActorId]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 50 };
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
    staleTime: 30_000,
    refetchInterval: 60_000,   // auto-refresh every 60 s
  });

  const { data: filterOpts } = useQuery({
    queryKey: ["audit-filters"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ actions: string[]; resourceTypes: string[] }>>(
        "/audit/filters"
      );
      return data.data;
    },
    staleTime: 60_000,
  });

  const entries = (data as any)?.data ?? [] as AuditEntry[];
  const meta    = (data as any)?.meta as PaginationMeta | undefined;

  const staffSummary = buildStaffSummary(entries);

  const hasActiveFilters =
    !!filters.action || !!filters.resourceType || !!filters.actorId || !!filters.to;

  const clearFilters = useCallback(() =>
    setFilters({ action: "", resourceType: "", actorId: "", from: defaultFrom(), to: "", page: 1 }),
  []);

  const filterByStaff = useCallback((actorId: string, email: string) => {
    setFilters((f) => ({ ...f, actorId, page: 1 }));
    setShowFilters(true);
    setShowSummary(false);
  }, []);

  // ── Quick range presets for the "from" filter ─────────────────────────────
  const QUICK_FROM = [
    { label: "Last 1h",    value: () => format(subHours(new Date(), 1),  "yyyy-MM-dd'T'HH:mm") },
    { label: "Last 24h",   value: () => format(subHours(new Date(), 24), "yyyy-MM-dd'T'HH:mm") },
    { label: "Last 7d",    value: () => format(subDays(new Date(), 7),   "yyyy-MM-dd'T'HH:mm") },
    { label: "Last 30d",   value: () => format(subDays(new Date(), 30),  "yyyy-MM-dd'T'HH:mm") },
  ];

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1200px] mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <div className="label-xs mb-1">Administration</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Staff Logs</h2>
          <p className="text-[12px] text-fg-subtle mt-1">
            {presetActorEmail
              ? `Showing activity for ${presetActorEmail}`
              : "Immutable record of all staff actions"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg-muted hover:text-fg transition-colors"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
              showFilters
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Pre-selected staff banner ───────────────────────────────────── */}
      {presetActorEmail && (
        <div className="flex items-center gap-2.5 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3">
          <div className="h-7 w-7 rounded-full bg-accent/20 grid place-items-center flex-shrink-0">
            <User className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-fg">{presetActorEmail.split("@")[0]}</p>
            <p className="text-[11px] text-fg-subtle">{presetActorEmail}</p>
          </div>
          <a
            href="/audit"
            className="text-[11px] text-fg-muted hover:text-fg transition-colors whitespace-nowrap"
          >
            View all staff →
          </a>
        </div>
      )}

      {/* ── Filters panel ──────────────────────────────────────────────── */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          {/* Quick date presets */}
          <div>
            <label className="label-xs mb-2 block">Quick range</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FROM.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setFilters((f) => ({ ...f, from: preset.value(), to: "", page: 1 }))}
                  className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="label-xs mb-1">Action type</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
                className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
              >
                <option value="">All actions</option>
                {/* Always show known types even if backend doesn't return them */}
                {Array.from(new Set([
                  ...Object.keys(ACTION_CONFIG),
                  ...(filterOpts?.actions ?? []),
                ])).sort().map((a: string) => (
                  <option key={a} value={a}>
                    {(ACTION_CONFIG[a]?.label ?? a.replace(/_/g, " ")).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-xs mb-1">Resource</label>
              <select
                value={filters.resourceType}
                onChange={(e) => setFilters((f) => ({ ...f, resourceType: e.target.value, page: 1 }))}
                className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
              >
                <option value="">All types</option>
                {filterOpts?.resourceTypes.map((r: string) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-xs mb-1">Staff email</label>
              <input
                type="text"
                placeholder="filter by email…"
                value={filters.actorId}
                onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value, page: 1 }))}
                className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="label-xs mb-1">From</label>
              <input
                type="datetime-local"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
                className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="label-xs mb-1">To</label>
              <input
                type="datetime-local"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
                className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Active staff summary ────────────────────────────────────────── */}
      {!isLoading && entries.length > 0 && staffSummary.length > 1 && !filters.actorId && (
        <div>
          <button
            onClick={() => setShowSummary((v) => !v)}
            className="flex items-center gap-2 text-[12px] font-medium text-fg-muted hover:text-fg transition-colors mb-2"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showSummary && "rotate-180")} />
            Active staff ({staffSummary.length})
          </button>
          {showSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {staffSummary.slice(0, 6).map((a) => (
                <StaffSummaryCard key={a.email} activity={a} onFilter={filterByStaff} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Log table ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 bg-surface-2 border-b border-border">
          <div className="w-7" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              Staff / Action
            </span>
            {meta && (
              <span className="text-[10px] text-fg-subtle">
                {meta.total} total
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">
            Time
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <ClipboardList className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No activity found</p>
            <p className="text-[11px] text-fg-subtle text-center max-w-[260px]">
              {hasActiveFilters
                ? "Try adjusting the filters or expanding the time range."
                : "Staff actions will appear here as your team uses the system."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-1 text-[12px] font-medium text-accent hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry: AuditEntry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-fg-subtle num">
            {meta.total} entries · Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={!meta.hasPrevPage}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={!meta.hasNextPage}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
