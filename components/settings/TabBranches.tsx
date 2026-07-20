"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Loader2,
  Info,
  MapPin,
  X,
  Search,
  User,
  Clock,
  Phone,
  Mail,
  Globe,
  AlertTriangle,
  Tag,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsShell } from "./SettingsShell";
import type { ApiSuccess, BranchSummary } from "@/types";
import { cn } from "@/lib/utils";
import { disconnectSocket } from "@/lib/sockets";

export function TabBranches() {
  const queryClient = useQueryClient();
  const { currentBranch, clearAuth, switchBranch } = useAuth();

  // Dialog / Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchSummary | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState<BranchSummary | null>(null);

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nameAsc");

  // Form Field States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Query: Load Branches ──────────────────────────────────────────────────
  const { data: branches = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["branches-list"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BranchSummary[]>>("/branches");
      return data.data || [];
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Create Branch
  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      slug?: string;
      branchCode?: string;
      managerName?: string;
      managerPhone?: string;
      managerEmail?: string;
      phone?: string;
      address?: string;
      sortOrder?: number;
      settings?: { timezone?: string };
    }) => {
      const { data } = await api.post("/branches", payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success("Branch created successfully.");
      setCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? err?.response?.data?.error?.message ?? "Failed to create branch");
    },
  });

  // Edit Branch
  const editMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      slug: string;
      branchCode?: string | null;
      managerName?: string | null;
      managerPhone?: string | null;
      managerEmail?: string | null;
      phone?: string | null;
      address?: string | null;
      sortOrder: number;
      settings?: { timezone?: string | null };
    }) => {
      const { data } = await api.patch(`/branches/${payload.id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success("Branch updated successfully.");
      setEditBranch(null);
      resetForm();
      refetch();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? err?.response?.data?.error?.message ?? "Failed to update branch");
    },
  });

  // Activate Branch
  const activateMutation = useMutation({
    mutationFn: async (branchId: string) => {
      await api.post(`/branches/${branchId}/activate`);
    },
    onSuccess: () => {
      toast.success("Branch activated successfully.");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to activate branch");
    },
  });

  // Deactivate Branch
  const deactivateMutation = useMutation({
    mutationFn: async (branchId: string) => {
      await api.post(`/branches/${branchId}/deactivate`);
    },
    onSuccess: (_, branchId) => {
      toast.success("Branch deactivated successfully.");
      setDeactivateConfirm(null);
      refetch();

      if (branchId === currentBranch?.id) {
        toast.info("You deactivated your active session branch. Logging out...");
        queryClient.clear();
        localStorage.clear();
        clearAuth();
        disconnectSocket();
        window.location.href = "/login";
      }
    },
    onError: (err: any) => {
      setDeactivateConfirm(null);
      const code = err?.response?.data?.error?.code;
      const message = err?.response?.data?.message ?? err?.response?.data?.error?.message ?? "";

      if (code === "LAST_ACTIVE_BRANCH") {
        toast.error("At least one Branch must remain active.");
      } else if (code === "BRANCH_HAS_ASSIGNED_STAFF") {
        toast.error("Reassign or deactivate active staff assigned to this Branch before deactivating it.");
      } else {
        toast.error(message || "Failed to deactivate branch");
      }
    },
  });

  // ─── Event Handlers ────────────────────────────────────────────────────────

  const resetForm = () => {
    setName("");
    setSlug("");
    setBranchCode("");
    setSortOrder(0);
    setManagerName("");
    setManagerPhone("");
    setManagerEmail("");
    setPhone("");
    setAddress("");
    setTimezone("");
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const handleOpenEdit = (branch: BranchSummary) => {
    setName(branch.name);
    setSlug(branch.slug);
    setBranchCode(branch.branchCode || "");
    setSortOrder(branch.sortOrder);
    setManagerName(branch.managerName || "");
    setManagerPhone(branch.managerPhone || "");
    setManagerEmail(branch.managerEmail || "");
    setPhone(branch.phone || "");
    setAddress(branch.address || "");
    setTimezone(branch.settings?.timezone || "");
    setFormError(null);
    setEditBranch(branch);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      slug: slug.trim() ? slug.trim() : undefined,
      branchCode: branchCode.trim() ? branchCode.trim() : undefined,
      managerName: managerName.trim() ? managerName.trim() : undefined,
      managerPhone: managerPhone.trim() ? managerPhone.trim() : undefined,
      managerEmail: managerEmail.trim() ? managerEmail.trim() : undefined,
      phone: phone.trim() ? phone.trim() : undefined,
      address: address.trim() ? address.trim() : undefined,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
      settings: timezone.trim() ? { timezone: timezone.trim() } : undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranch) return;
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    editMutation.mutate({
      id: editBranch.id,
      name: name.trim(),
      slug: slug.trim(),
      branchCode: branchCode.trim() || null,
      managerName: managerName.trim() || null,
      managerPhone: managerPhone.trim() || null,
      managerEmail: managerEmail.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      sortOrder: Number(sortOrder),
      settings: {
        timezone: timezone.trim() || null,
      },
    });
  };

  // ─── Filter & Sort Calculations ──────────────────────────────────────────
  const totalCount = branches.length;
  const activeCount = branches.filter((b: BranchSummary) => b.isActive).length;
  const inactiveCount = branches.filter((b: BranchSummary) => !b.isActive).length;

  const totalOrdersSum = branches.reduce((sum: number, b: BranchSummary) => sum + (b.statistics?.todayOrders ?? 0), 0);
  const totalStaffSum = branches.reduce((sum: number, b: BranchSummary) => sum + (b.statistics?.staffCount ?? 0), 0);
  const totalQrSum = branches.reduce((sum: number, b: BranchSummary) => sum + (b.statistics?.qrCount ?? 0), 0);

  const uniqueManagers: string[] = Array.from(
    new Set(branches.map((b: BranchSummary) => b.managerName).filter(Boolean) as string[])
  );

  const filteredBranches = branches.filter((branch: BranchSummary) => {
    const term = search.toLowerCase();
    const matchesSearch =
      branch.name.toLowerCase().includes(term) ||
      branch.slug.toLowerCase().includes(term) ||
      (branch.branchCode && branch.branchCode.toLowerCase().includes(term)) ||
      (branch.managerName && branch.managerName.toLowerCase().includes(term)) ||
      (branch.address && branch.address.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? branch.isActive : !branch.isActive);

    const matchesManager =
      managerFilter === "all" || branch.managerName === managerFilter;

    return matchesSearch && matchesStatus && matchesManager;
  });

  const sortedBranches = [...filteredBranches].sort((a, b) => {
    if (sortBy === "nameDesc") {
      return b.name.localeCompare(a.name);
    }
    if (sortBy === "orders") {
      return (b.statistics?.todayOrders ?? 0) - (a.statistics?.todayOrders ?? 0);
    }
    if (sortBy === "staff") {
      return (b.statistics?.staffCount ?? 0) - (a.statistics?.staffCount ?? 0);
    }
    return a.name.localeCompare(b.name);
  });

  const hasActiveFilters = !!(search || statusFilter !== "all" || managerFilter !== "all" || sortBy !== "nameAsc");

  return (
    <div className="space-y-6">
      <SettingsShell
        title="Branches"
        description="Configure physical restaurant outlets, activate/deactivate branches, and control display orders."
        actions={
          <Button onClick={handleOpenCreate} size="sm" className="flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Create Branch
          </Button>
        }
      >
        {/* Branch Summary Ribbon */}
        {!isLoading && branches.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
            {[
              { label: "Total Branches", count: totalCount, color: "text-fg bg-white/5 border-white/10" },
              { label: "Active", count: activeCount, color: "text-success bg-success/10 border-success/20" },
              { label: "Disabled", count: inactiveCount, color: "text-danger bg-danger/10 border-danger/20" },
              { label: "Today's Orders", count: totalOrdersSum, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
              { label: "Active Staff", count: totalStaffSum, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
              { label: "QR Codes", count: totalQrSum, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={cn("flex flex-col gap-1 p-3 rounded-xl border transition-all", stat.color)}>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">{stat.label}</span>
                <span className="text-xl font-bold tracking-tight num">{stat.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Unified Search & Filters Toolbar */}
        {!isLoading && branches.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center bg-white/[0.02] border border-white/5 p-3 rounded-xl mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search branches by name, manager, code, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              >
                <option value="all">All Managers</option>
                {uniqueManagers.map((m: string) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              >
                <option value="nameAsc">Name (A-Z)</option>
                <option value="nameDesc">Name (Z-A)</option>
                <option value="orders">Today's Orders</option>
                <option value="staff">Staff Size</option>
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-[11px] px-2.5 hover:bg-white/5 text-fg-subtle hover:text-fg"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setManagerFilter("all");
                    setSortBy("nameAsc");
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loaders & State indicators */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <p className="text-[13px] text-fg-subtle">Failed to load branches.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center rounded-xl border border-border bg-surface">
            <div className="h-10 w-10 rounded-lg border border-border bg-surface-2 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-semibold text-fg">No branches yet</p>
            <p className="text-[11px] text-fg-subtle max-w-[260px]">
              Create your first branch to begin managing multiple locations.
            </p>
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 mt-2 cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Create Branch
            </Button>
          </div>
        ) : sortedBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center rounded-xl border border-border bg-surface animate-fade-in">
            <div className="h-10 w-10 rounded-lg border border-border bg-surface-2 flex items-center justify-center">
              <Search className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-semibold text-fg">No matching branches</p>
            <p className="text-[11px] text-fg-subtle max-w-[260px]">Try adjusting your search query or filters.</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setManagerFilter("all");
                setSortBy("nameAsc");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* Branches Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBranches.map((branch: BranchSummary) => {
              const isCurrent = branch.id === currentBranch?.id;

              return (
                <div
                  key={branch.id}
                  className={cn(
                    "flex flex-col rounded-xl border p-4 bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-200 relative overflow-hidden",
                    isCurrent ? "border-accent/30 shadow-[0_0_12px_rgba(255,255,255,0.03)]" : "border-white/5"
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-fg truncate">{branch.name}</span>
                        {isCurrent && (
                          <span className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-extrabold text-accent uppercase tracking-wider">
                            Active Session
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-fg-subtle font-mono">
                        <span>slug: {branch.slug}</span>
                        {branch.branchCode && (
                          <span className="bg-white/5 border border-white/10 px-1 rounded text-fg-muted font-mono">
                            {branch.branchCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full animate-pulse",
                          branch.isActive ? "bg-success" : "bg-danger"
                        )}
                      />
                      <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">
                        {branch.isActive ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>

                  {/* Manager & Contact Details (Zero-Trust Persisted Data Only) */}
                  <div className="space-y-1.5 text-[11.5px] text-fg-muted font-normal border-t border-b border-white/5 py-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-fg-subtle shrink-0" />
                        <span className="truncate">
                          Manager:{" "}
                          {branch.managerName ? (
                            <strong className="text-fg">{branch.managerName}</strong>
                          ) : (
                            <button
                              onClick={() => handleOpenEdit(branch)}
                              className="text-accent hover:underline italic font-medium cursor-pointer"
                            >
                              Add Manager
                            </button>
                          )}
                        </span>
                      </div>
                      {branch.managerPhone && (
                        <span className="text-[10px] text-fg-subtle font-mono">{branch.managerPhone}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-fg-subtle shrink-0" />
                      {branch.address ? (
                        <span className="truncate" title={branch.address}>
                          {branch.address}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenEdit(branch)}
                          className="text-accent hover:underline italic font-medium cursor-pointer text-[11px]"
                        >
                          Add Address
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone className="h-3.5 w-3.5 text-fg-subtle shrink-0" />
                        {branch.phone ? (
                          <span>{branch.phone}</span>
                        ) : (
                          <span className="text-fg-subtle italic text-[10.5px]">Not Configured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-fg-subtle">
                        <Globe className="h-3 w-3" />
                        <span>{branch.settings?.timezone || "Not Configured"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2 text-center bg-white/5 p-2.5 rounded-lg mb-4 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">Orders Today</span>
                      <span className="text-[13px] font-bold text-fg num">{branch.statistics?.todayOrders ?? 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-l border-white/5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">Active Staff</span>
                      <span className="text-[13px] font-bold text-fg num">{branch.statistics?.staffCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Actions area */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                    <Button
                      size="sm"
                      disabled={isCurrent || !branch.isActive}
                      onClick={() => {
                        switchBranch(branch.id);
                        toast.success(`Switched active branch to ${branch.name}`);
                      }}
                      className={cn(
                        "flex-1 h-8 text-[11px] font-semibold cursor-pointer",
                        isCurrent
                          ? "bg-white/5 text-fg-subtle border border-white/10 hover:bg-white/5"
                          : "bg-accent hover:bg-accent/90 text-white"
                      )}
                    >
                      {isCurrent ? "Current Outlet" : "Open Branch"}
                    </Button>

                    <button
                      onClick={() => handleOpenEdit(branch)}
                      title="Edit branch details"
                      className="h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-white/5 hover:text-fg transition-colors border border-white/10 shrink-0 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {branch.isActive ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeactivateConfirm(branch)}
                        className="text-danger hover:bg-danger/10 hover:text-danger cursor-pointer h-8 text-[11px] px-2.5"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => activateMutation.mutate(branch.id)}
                        className="text-success hover:bg-success/10 hover:text-success cursor-pointer h-8 text-[11px] px-2.5"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SettingsShell>

      {/* Explanatory menu warning */}
      <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 flex gap-2.5 items-start mt-6">
        <Info className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
        <div className="text-[12px] leading-relaxed text-fg-muted">
          <p className="font-semibold text-fg">Shared Restaurant Properties</p>
          <p className="mt-0.5 font-normal">
            Menus, pricing, branding guidelines, and system configurations are currently shared across all Branches.
            Operations are scoped by the active branch selected in your session context.
          </p>
        </div>
      </div>

      {/* ── Create Branch Modal ── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[480px] rounded-xl border border-border bg-[#0F0F10] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150 text-fg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-[14px] font-semibold text-fg">Create Outlet Branch</h3>
              <button onClick={() => setCreateOpen(false)} className="text-fg-subtle hover:text-fg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs text-danger leading-relaxed">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Branch Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Second Branch"
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Slug (Optional)</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. second-branch"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Branch Code</label>
                  <Input
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. BR-002"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Manager Name</label>
                <Input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Physical Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 456 Commercial Street"
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={createMutation.isPending}
                  className="border-white/10 hover:bg-white/5 text-fg h-9 text-[12px]"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-accent hover:bg-accent/90 text-white h-9 text-[12px]">
                  {createMutation.isPending ? "Creating..." : "Create Outlet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Branch Modal ── */}
      {editBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[500px] rounded-xl border border-border bg-[#0F0F10] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150 text-fg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-[14px] font-semibold text-fg">Edit Branch Details</h3>
              <button onClick={() => setEditBranch(null)} className="text-fg-subtle hover:text-fg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs text-danger leading-relaxed">
                  {formError}
                </div>
              )}

              {/* Group 1: Identity Info */}
              <div className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                  Identity Info
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Branch Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Second Branch"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Slug *</label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. second-branch"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Branch Code</label>
                    <Input
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      placeholder="e.g. BR-001"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Sort Order</label>
                    <Input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Manager & Contact */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                  Manager & Contact
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Manager Name</label>
                    <Input
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Manager Phone</label>
                    <Input
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      placeholder="e.g. +91 9800000000"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Physical Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Commercial Street"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Branch Phone</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 8000000000"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Timezone</label>
                    <Input
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="e.g. Asia/Kolkata"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditBranch(null)}
                  disabled={editMutation.isPending}
                  className="border-white/10 hover:bg-white/5 text-fg h-9 text-[12px]"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending} className="bg-accent hover:bg-accent/90 text-white h-9 text-[12px]">
                  {editMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deactivate Warning Modal ── */}
      {deactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[420px] rounded-xl border border-danger/20 bg-[#0F0F10] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150 text-fg">
            <div className="flex items-center gap-2.5 text-danger mb-3 border-b border-white/5 pb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-[14px] font-semibold">Deactivate Branch: {deactivateConfirm.name}?</h3>
            </div>

            <div className="text-[12px] text-fg-muted space-y-2 leading-relaxed font-normal">
              <p>Deactivating this outlet has operational consequences:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>New orders cannot be routed to this branch.</li>
                <li>QR codes matching this branch will stop resolving.</li>
                <li>Active logged-in sessions for this branch will be invalidated.</li>
              </ul>
              <p className="font-semibold text-fg mt-2">Are you sure you want to proceed?</p>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/5">
              <Button
                variant="outline"
                onClick={() => setDeactivateConfirm(null)}
                disabled={deactivateMutation.isPending}
                className="border-white/10 hover:bg-white/5 text-fg h-9 text-[12px]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deactivateMutation.mutate(deactivateConfirm.id)}
                disabled={deactivateMutation.isPending}
                className="bg-danger hover:bg-danger/90 text-white h-9 text-[12px]"
              >
                {deactivateMutation.isPending ? "Deactivating..." : "Deactivate outlet"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
