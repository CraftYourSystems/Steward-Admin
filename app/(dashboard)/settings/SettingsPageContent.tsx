"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Save, RotateCcw, Loader2, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings, useUpdateRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { useAuth } from "@/hooks/useAuth";
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
import type { RestaurantSettings } from "@/types/settings";
import { cn } from "@/lib/utils";

export default function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const { data: serverSettings, isLoading, isError } = useRestaurantSettings();
  const { mutate: save, isPending: isSaving } = useUpdateRestaurantSettings();

  const [draft, setDraft]     = useState<RestaurantSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Sync active tab from query parameters
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Warn the user before they navigate away with unsaved changes (FIX 7.4)
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (activeTab === "security" && !isAdmin) {
      setActiveTab("general");
    }
  }, [activeTab, isAdmin]);

  // Sync draft from server data
  useEffect(() => {
    if (serverSettings && !isDirty) {
      setDraft(serverSettings);
    }
  }, [serverSettings, isDirty]);

  const patch = (partial: Partial<RestaurantSettings>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!draft) return;
    save(draft, {
      onSuccess: (savedSettings) => {
        setDraft(prev => prev ? { ...prev, ...savedSettings } : savedSettings);
        setIsDirty(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      },
    });
  };

  const handleReset = () => {
    if (serverSettings) {
      setDraft(serverSettings);
      setIsDirty(false);
    }
  };

  const tabs = [
    { value: "general",    label: "General" },
    { value: "theme",      label: "Theme & Menu" },
    { value: "operations", label: "Operations" },
    { value: "team",       label: "Team & Notifications" },
    { value: "payments",   label: "Payments" },
    { value: "ordering",   label: "Ordering & Tables" },
    { value: "customer",   label: "Customer Experience" },
    { value: "branding",   label: "Branding" },
    { value: "shifts",     label: "Shifts" },
  ];

  if (isAdmin) {
    tabs.push({ value: "security", label: "Security" });
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[13px] text-fg-subtle">Failed to load settings.</p>
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
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
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-48px)]">
      {/* ── Left Sidebar (Master) ── */}
      <div className="w-[260px] flex-shrink-0 border-r border-white/5 bg-transparent overflow-y-auto scrollbar-thin">
        <div className="p-5">
          <div className="label-xs mb-1">Configuration</div>
          <h2 className="text-lg font-semibold tracking-tight text-fg mb-4">Settings</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
            <TabsList className="flex flex-col h-auto bg-transparent border-0 p-0 items-stretch gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "justify-start px-3 py-2 text-[13px] font-medium rounded-lg transition-colors border border-transparent shadow-none data-[state=active]:shadow-none",
                    activeTab === tab.value 
                      ? "bg-white/10 text-fg border-white/10" 
                      : "text-fg-muted hover:bg-white/5 hover:text-fg"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ── Right Content (Detail) ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-transparent relative">
        {/* Sticky Header with Actions */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-bg/80 backdrop-blur-md">
          <div>
            <h3 className="text-lg font-semibold text-fg">
              {tabs.find(t => t.value === activeTab)?.label}
            </h3>
            <p className="text-[12px] text-fg-subtle">
              Manage your {tabs.find(t => t.value === activeTab)?.label.toLowerCase()} settings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
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
            <Button
              size="sm"
              onClick={handleSave}
              disabled={(!isDirty && !isSaved) || isSaving}
              className={isSaved ? 'bg-success hover:bg-success/90 text-white' : ''}
            >
              {isSaving ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
              ) : isSaved ? (
                <><Check className="h-3.5 w-3.5 mr-1.5" />Saved</>
              ) : (
                <><Save className="h-3.5 w-3.5 mr-1.5" />Save changes</>
              )}
            </Button>
          </div>
        </div>

        <div className="px-8 py-6 max-w-[800px]">
          {isDirty && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-warning shrink-0" />
              <span className="text-[13px] text-warning font-medium">You have unsaved changes. Remember to save before navigating away.</span>
            </div>
          )}

          <Tabs value={activeTab} className="w-full">
            {/* Empty TabsList to satisfy Radix UI if it requires one for accessibility, though strictly not needed if we control the state */}
            <TabsList className="hidden" />

            <TabsContent value="general" className="mt-0 focus-visible:outline-none">
              <TabGeneral settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="theme" className="mt-0 focus-visible:outline-none">
              <TabTheme settings={draft} onChange={patch} />
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
            <TabsContent value="branding" className="mt-0 focus-visible:outline-none">
              <TabBranding settings={draft} onChange={patch} />
            </TabsContent>
            <TabsContent value="shifts" className="mt-0 focus-visible:outline-none">
              <TabShifts />
            </TabsContent>
            {isAdmin && (
              <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                <TabSecurity />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
