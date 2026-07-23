"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Save, RotateCcw, Loader2, Check, Clock, ChevronDown,
  Settings2, Building2, Zap, ShoppingCart, CreditCard, Users, Palette, Shield, Puzzle, QrCode, Timer, Star, Lock,
} from "lucide-react";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings, useUpdateRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { useAuth } from "@/hooks/useAuth";
import { ConfigurationOverview } from "@/components/settings/ConfigurationOverview";
import { TabGeneral } from "@/components/settings/TabGeneral";
import { TabTheme } from "@/components/settings/TabTheme";
import { TabOperations } from "@/components/settings/TabOperations";
import { TabStaffNotifications } from "@/components/settings/TabStaffNotifications";
import { TabBranding } from "@/components/settings/TabBranding";
import { TabShifts } from "@/components/settings/TabShifts";
import { TabSecurity } from "@/components/settings/TabSecurity";
import { TabPayments } from "@/components/settings/TabPayments";
import { TabOrderTypes } from "@/components/settings/TabOrderTypes";
import { TabCustomerExperience } from "@/components/settings/TabCustomerExperience";
import { TabBranches } from "@/components/settings/TabBranches";
import { TabQRCodes } from "@/components/settings/TabQRCodes";
import { TabIntegrations } from "@/components/settings/TabIntegrations";
import type { RestaurantSettings } from "@/types/settings";
import { cn } from "@/lib/utils";

// Tabs that have their own save mechanism or don't use the global draft
const SELF_MANAGING_TABS = ["branches", "qrcodes", "integrations"];
// Tabs that are coming soon (disabled)
const COMING_SOON_TABS = ["branding", "theme"];

interface TabGroup {
  name: string;
  items: {
    value: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    comingSoon?: boolean;
  }[];
}

export default function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { user, currentBranch } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const { data: serverSettings, isLoading, isError } = useRestaurantSettings();
  const { mutate: save, isPending: isSaving } = useUpdateRestaurantSettings();

  const [draft, setDraft] = useState<RestaurantSettings | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if (!draft || !serverSettings) return false;
    return JSON.stringify(draft) !== JSON.stringify(serverSettings);
  }, [draft, serverSettings]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (activeTab === "security" && !isAdmin) setActiveTab("general");
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (serverSettings && !draft) setDraft(serverSettings);
  }, [serverSettings, draft]);

  // Click outside to close dropdowns
  useEffect(() => {
    const closeDropdown = () => setOpenGroup(null);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  const patch = (partial: Partial<RestaurantSettings>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const handleSave = () => {
    if (!draft) return;
    save(draft, {
      onSuccess: (savedSettings) => {
        setDraft(savedSettings);
        setLastSavedAt(new Date());
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      },
    });
  };

  const handleReset = () => {
    if (serverSettings) setDraft(serverSettings);
  };

  const tabGroups: TabGroup[] = useMemo(() => [
    {
      name: "Restaurant",
      items: [
        { value: "general", label: "General", icon: <Settings2 className="h-3.5 w-3.5" /> },
        { value: "branding", label: "Branding", icon: <Palette className="h-3.5 w-3.5" />, comingSoon: true },
        ...(isAdmin ? [{ value: "branches", label: "Branches", icon: <Building2 className="h-3.5 w-3.5" />, adminOnly: true }] : []),
      ],
    },
    {
      name: "Operations",
      items: [
        { value: "operations", label: "Operations", icon: <Zap className="h-3.5 w-3.5" /> },
        { value: "ordering", label: "Ordering & Tables", icon: <ShoppingCart className="h-3.5 w-3.5" /> },
        ...(isAdmin ? [{ value: "qrcodes", label: "QR Codes", icon: <QrCode className="h-3.5 w-3.5" />, adminOnly: true }] : []),
        { value: "shifts", label: "Shifts", icon: <Timer className="h-3.5 w-3.5" /> },
      ],
    },
    {
      name: "Businesses",
      items: [
        { value: "payments", label: "Payments", icon: <CreditCard className="h-3.5 w-3.5" /> },
        { value: "customer", label: "Customer Experience", icon: <Star className="h-3.5 w-3.5" /> },
      ],
    },
    {
      name: "People & System",
      items: [
        { value: "team", label: "Team & Notifications", icon: <Users className="h-3.5 w-3.5" /> },
        { value: "theme", label: "Theme & Display", icon: <Palette className="h-3.5 w-3.5" />, comingSoon: true },
        ...(isAdmin ? [{ value: "security", label: "Security", icon: <Shield className="h-3.5 w-3.5" />, adminOnly: true }] : []),
      ],
    },
    {
      name: "Ecosystem",
      items: [
        { value: "integrations", label: "Integrations", icon: <Puzzle className="h-3.5 w-3.5" /> },
      ],
    },
  ], [isAdmin]);

  const isSelfManaging = SELF_MANAGING_TABS.includes(activeTab);
  const isComingSoon = COMING_SOON_TABS.includes(activeTab);

  const activeGroup = useMemo(() => {
    return tabGroups.find(g => g.items.some(t => t.value === activeTab));
  }, [activeTab, tabGroups]);

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[13px] text-fg-subtle">Failed to load settings.</p>
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-fg-subtle" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[13px] text-fg-subtle">Settings unavailable.</p>
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col bg-transparent">

      {/* ── Sticky Top Bar with Breadcrumb, Actions, & Dropdown Nav ── */}
      <div className="sticky top-0 z-10 w-full border-b border-white/5 bg-bg/85 backdrop-blur-md">
        {/* Breadcrumbs & Actions Row */}
        <div className="px-5 py-3 lg:px-8 max-w-[1100px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-widest shrink-0">Settings</span>
            {activeGroup && (
              <>
                <span className="text-[11px] text-fg-muted shrink-0">/</span>
                <span className="text-[12px] font-semibold text-fg-muted shrink-0">{activeGroup.name}</span>
              </>
            )}
            {activeTab && (
              <>
                <span className="text-[11px] text-fg-muted shrink-0">/</span>
                <span className="text-[13px] font-semibold text-fg truncate capitalize">
                  {tabGroups.flatMap(g => g.items).find(t => t.value === activeTab)?.label ?? activeTab}
                </span>
              </>
            )}
            {isComingSoon && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wide shrink-0">
                Coming Soon
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lastSavedAt && !isDirty && (
              <span className="text-[11px] text-fg-subtle flex items-center gap-1 mr-1 bg-surface-2/80 px-2.5 py-1 rounded-md border border-border">
                <Clock className="h-3 w-3" />
                Saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {isDirty && !isSelfManaging && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
                className="text-fg-muted hover:bg-white/5"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            )}
            {!isSelfManaging && !isComingSoon && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className={isSaved ? "bg-success hover:bg-success/90 text-white" : ""}
              >
                {isSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
                ) : isSaved ? (
                  <><Check className="h-3.5 w-3.5 mr-1.5" />Saved</>
                ) : (
                  <><Save className="h-3.5 w-3.5 mr-1.5" />Save changes</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ── Dropdown Top Navigation ── */}
        <div className="border-t border-white/5">
          <nav className="relative flex flex-wrap items-center gap-1.5 py-2 px-5 lg:px-8 max-w-[1100px] mx-auto">
            {tabGroups.map((group) => {
              const isCurrent = activeGroup?.name === group.name;
              const isOpen = openGroup === group.name;
              return (
                <div
                  key={group.name}
                  className="relative"
                  onMouseEnter={() => setOpenGroup(group.name)}
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenGroup(isOpen ? null : group.name);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                      isCurrent
                        ? "bg-white/10 text-fg"
                        : "text-fg-muted hover:bg-white/5 hover:text-fg"
                    )}
                  >
                    <span>{group.name}</span>
                    <ChevronDown className={cn("h-3 w-3 text-fg-subtle transition-transform duration-200", isOpen && "rotate-180")} />
                  </button>

                  {/* Dropdown Menu Popup */}
                  {isOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-white/10 bg-surface/95 backdrop-blur-lg p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {group.items.map((tab) => {
                        const isActive = activeTab === tab.value;
                        const disabled = tab.comingSoon;
                        return (
                          <button
                            key={tab.value}
                            disabled={disabled}
                            onClick={() => {
                              if (!disabled) {
                                setActiveTab(tab.value);
                                setOpenGroup(null);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left group",
                              isActive
                                ? "bg-white/10 text-fg"
                                : disabled
                                ? "text-fg-muted/40 cursor-not-allowed"
                                : "text-fg-muted hover:bg-white/5 hover:text-fg"
                            )}
                          >
                            <span className={cn(
                              "shrink-0 transition-colors",
                              isActive ? "text-accent" : disabled ? "text-fg-muted/30" : "text-fg-subtle group-hover:text-fg-muted"
                            )}>
                              {disabled ? <Lock className="h-3.5 w-3.5" /> : tab.icon}
                            </span>
                            <span className="flex-1 truncate">{tab.label}</span>
                            {tab.comingSoon && (
                              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-fg-muted/50 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-full">
                                Soon
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main Layout: Content Area ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin max-w-[1100px] mx-auto w-full">
        <div className="p-5 lg:p-8">

          {/* Configuration Overview — only on general tab */}
          {activeTab === "general" && (
            <ConfigurationOverview
              settings={draft}
              branchName={currentBranch?.name}
              activeQrCount={12}
            />
          )}

          {isDirty && !isSelfManaging && !isComingSoon && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-warning shrink-0 animate-pulse" />
              <span className="text-[13px] text-warning font-medium">
                You have unsaved changes. Save to apply them across Steward.
              </span>
            </div>
          )}

          {/* Coming Soon Placeholder */}
          {isComingSoon && (
            <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div className="h-16 w-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
                <Lock className="h-7 w-7 text-fg-subtle" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-fg mb-1">
                  {tabGroups.flatMap(g => g.items).find(t => t.value === activeTab)?.label} — Coming Soon
                </h3>
                <p className="text-[13px] text-fg-subtle max-w-sm mx-auto">
                  This feature is currently in development and will be available in a future update.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5 text-[11px] font-semibold text-accent">
                <Zap className="h-3.5 w-3.5" />
                Available in the next release
              </span>
            </div>
          )}

          <Tabs value={activeTab} className="w-full">
            <TabsList className="hidden" />

            <TabsContent value="general" className="mt-0 focus-visible:outline-none">
              <TabGeneral settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="operations" className="mt-0 focus-visible:outline-none">
              <TabOperations settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="team" className="mt-0 focus-visible:outline-none">
              <TabStaffNotifications settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="payments" className="mt-0 focus-visible:outline-none">
              <TabPayments settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="ordering" className="mt-0 focus-visible:outline-none">
              <TabOrderTypes settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="customer" className="mt-0 focus-visible:outline-none">
              <TabCustomerExperience settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="shifts" className="mt-0 focus-visible:outline-none">
              <TabShifts />
            </TabsContent>
            <TabsContent value="integrations" className="mt-0 focus-visible:outline-none">
              <TabIntegrations />
            </TabsContent>
            {isAdmin && (
              <>
                <TabsContent value="branches" className="mt-0 focus-visible:outline-none">
                  <TabBranches />
                </TabsContent>
                <TabsContent value="qrcodes" className="mt-0 focus-visible:outline-none">
                  <TabQRCodes />
                </TabsContent>
                <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                  <TabSecurity />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
