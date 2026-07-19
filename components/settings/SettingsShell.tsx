"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  id?: string;
  group?: string;
}

export function SettingsShell({ title, description, children, actions, id, group }: SettingsShellProps) {
  return (
    <div 
      id={id} 
      data-settings-group={group ?? title.toLowerCase().replace(/\s+/g, "-")} 
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-fg tracking-tight">{title}</h3>
          {description && (
            <p className="text-[12px] text-fg-subtle mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SettingsRow({ label, description, children, className, id }: SettingsRowProps) {
  return (
    <div 
      id={id}
      data-settings-field={label.toLowerCase().replace(/\s+/g, "-")}
      className={cn(
        "flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-border last:border-0",
        className
      )}
    >
      <div className="sm:w-56 shrink-0">
        <div className="text-[13px] font-medium text-fg">{label}</div>
        {description && (
          <div className="text-[11px] text-fg-subtle mt-0.5 leading-relaxed">{description}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function SettingsSection({ 
  children, 
  className,
  id,
  title,
  description
}: { 
  children: ReactNode; 
  className?: string;
  id?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div 
      id={id}
      data-settings-section={title ? title.toLowerCase().replace(/\s+/g, "-") : undefined}
      className={cn("space-y-2.5")}
    >
      {(title || description) && (
        <div className="px-1 pt-1">
          {title && <h3 className="text-[14px] font-semibold text-fg tracking-tight">{title}</h3>}
          {description && <p className="text-[11px] text-fg-subtle mt-0.5">{description}</p>}
        </div>
      )}
      <div className={cn("rounded-xl border border-border bg-surface px-5 py-1", className)}>
        {children}
      </div>
    </div>
  );
}

export interface SystemOverviewItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

export interface SystemOverviewCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  statusBadge?: {
    text: string;
    variant?: "success" | "warning" | "danger" | "info" | "neutral";
  };
  items?: SystemOverviewItem[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
}

export function SystemOverviewCard({
  title,
  description,
  icon,
  statusBadge,
  items,
  actions,
  children,
  className,
  id,
}: SystemOverviewCardProps) {
  const variantStyles = {
    success: "bg-success/15 text-success border-success/20",
    warning: "bg-warning/15 text-warning border-warning/20",
    danger: "bg-danger/15 text-danger border-danger/20",
    info: "bg-accent/15 text-accent border-accent/20",
    neutral: "bg-white/10 text-fg-muted border-white/10",
  };

  return (
    <div
      id={id}
      data-card-type="system-overview"
      className={cn(
        "rounded-xl border border-border bg-surface p-5 transition-all shadow-sm hover:border-border-strong",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-fg-subtle shrink-0">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg tracking-tight">{title}</span>
              {statusBadge && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                    variantStyles[statusBadge.variant ?? "success"]
                  )}
                >
                  {statusBadge.text}
                </span>
              )}
            </div>
            {description && <p className="text-[11px] text-fg-subtle mt-0.5">{description}</p>}
          </div>
        </div>

        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>

      {items && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 mt-3 border-t border-border/60">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col rounded-lg bg-surface-2/60 border border-border/40 px-3 py-2">
              <span className="text-[10px] font-medium text-fg-subtle uppercase tracking-wider mb-0.5 flex items-center gap-1">
                {item.icon && <span className="text-fg-subtle">{item.icon}</span>}
                {item.label}
              </span>
              <span className="text-[12px] font-medium text-fg font-mono truncate">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {children && <div className="mt-3 pt-3 border-t border-border/60">{children}</div>}
    </div>
  );
}

// InformationCard is an alias for SystemOverviewCard for clean semantic domain usage
export const InformationCard = SystemOverviewCard;
