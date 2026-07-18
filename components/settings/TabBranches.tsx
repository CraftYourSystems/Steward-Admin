"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  MapPin,
  X,
  ChevronRight,
  Search,
  Building,
  User,
  Clock,
  Phone,
  Mail,
  Activity,
  Users,
  QrCode,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsShell, SettingsSection } from "./SettingsShell";
import type { ApiSuccess, BranchSummary } from "@/types";
import { cn } from "@/lib/utils";
import { disconnectSocket } from "@/lib/sockets";

interface CustomBranchInfo {
  manager: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  todayOrders: number;
  staffCount: number;
  qrCount: number;
  lastActivity: string;
}

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
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Custom Fields (Mock database stored in Local Session State)
  const [branchDetailsMap, setBranchDetailsMap] = useState<Record<string, CustomBranchInfo>>({});
  const [manager, setManager] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  // ─── Query: Load Branches ──────────────────────────────────────────────────
  const { data: branches = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["branches-list"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<BranchSummary[]>>("/branches");
      return data.data || [];
    },
  });

  // Helper to load or generate custom details for a branch deterministically
  const getInfo = (id: string, branchName: string): CustomBranchInfo => {
    if (branchDetailsMap[id]) {
      return branchDetailsMap[id];
    }
    const hash = branchName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const todayOrders = (hash % 150) + 35;
    const staffCount = (hash % 12) + 6;
    const qrCount = (hash % 15) + 8;
    const lastActivity = hash % 2 === 0 ? "Just now" : `${(hash % 35) + 5}m ago`;
    const managerName = hash % 3 === 0 ? "John Doe" : hash % 3 === 1 ? "Jane Smith" : "David Lee";
    const physicalAddress = `${(hash % 800) + 100} Main Road, Sector ${(hash % 5) + 1}`;
    const phoneNo = `+91 98765 ${String(10000 + (hash % 89999))}`;
    const emailAddr = `${branchName.toLowerCase().replace(/\s+/g, "")}@steward.app`;
    const timings = "09:00 AM - 11:00 PM";

    return {
      manager: managerName,
      address: physicalAddress,
      phone: phoneNo,
      email: emailAddr,
      openingHours: timings,
      todayOrders,
      staffCount,
      qrCount,
      lastActivity,
    };
  };

  // ─── Mutations ─────────────────────────────────────────────────────────────
  
  // Create Branch
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; slug?: string; sortOrder?: number }) => {
      const { data } = await api.post("/branches", payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success("Branch created successfully.");
      setCreateOpen(false);
      setName("");
      setSlug("");
      setSortOrder(0);
      setFormError(null);
      refetch();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? err?.response?.data?.error?.message ?? "Failed to create branch");
    }
  });

  // Edit Branch
  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; slug: string; sortOrder: number }) => {
      const { data } = await api.patch(`/branches/${payload.id}`, {
        name: payload.name,
        slug: payload.slug,
        sortOrder: payload.sortOrder,
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success("Branch updated successfully.");
      setEditBranch(null);
      setName("");
      setSlug("");
      setSortOrder(0);
      setFormError(null);
      refetch();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? err?.response?.data?.error?.message ?? "Failed to update branch");
    }
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
    }
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

      // If current active branch is deactivated, perform safety log out
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
    }
  });

  // ─── Event Handlers ────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setName("");
    setSlug("");
    setSortOrder(0);
    setFormError(null);
    setCreateOpen(true);
  };

  const handleOpenEdit = (branch: BranchSummary) => {
    const info = getInfo(branch.id, branch.name);
    setName(branch.name);
    setSlug(branch.slug);
    setSortOrder(branch.sortOrder);
    setManager(info.manager);
    setAddress(info.address);
    setPhone(info.phone);
    setEmail(info.email);
    setOpeningHours(info.openingHours);
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
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
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
      sortOrder: Number(sortOrder),
    });

    setBranchDetailsMap((prev) => ({
      ...prev,
      [editBranch.id]: {
        ...getInfo(editBranch.id, editBranch.name),
        manager: manager.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        openingHours: openingHours.trim(),
        lastActivity: "Just now",
      },
    }));
  };

  // ─── Filter & Sort Calculations ──────────────────────────────────────────
  const totalCount = branches.length;
  const activeCount = branches.filter((b: BranchSummary) => b.isActive).length;
  const inactiveCount = branches.filter((b: BranchSummary) => !b.isActive).length;

  const totalOrdersSum = branches.reduce((sum: number, b: BranchSummary) => sum + getInfo(b.id, b.name).todayOrders, 0);
  const totalStaffSum = branches.reduce((sum: number, b: BranchSummary) => sum + getInfo(b.id, b.name).staffCount, 0);
  const totalQrSum = branches.reduce((sum: number, b: BranchSummary) => sum + getInfo(b.id, b.name).qrCount, 0);

  const uniqueManagers: string[] = Array.from(new Set(branches.map((b: BranchSummary) => getInfo(b.id, b.name).manager)));

  const filteredBranches = branches.filter((branch: BranchSummary) => {
    const info = getInfo(branch.id, branch.name);
    const term = search.toLowerCase();
    const matchesSearch =
      branch.name.toLowerCase().includes(term) ||
      branch.slug.toLowerCase().includes(term) ||
      info.manager.toLowerCase().includes(term) ||
      info.address.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? branch.isActive : !branch.isActive);

    const matchesManager = managerFilter === "all" || info.manager === managerFilter;

    return matchesSearch && matchesStatus && matchesManager;
  });

  const sortedBranches = [...filteredBranches].sort((a, b) => {
    const infoA = getInfo(a.id, a.name);
    const infoB = getInfo(b.id, b.name);

    if (sortBy === "nameDesc") {
      return b.name.localeCompare(a.name);
    }
    if (sortBy === "orders") {
      return infoB.todayOrders - infoA.todayOrders;
    }
    if (sortBy === "staff") {
      return infoB.staffCount - infoA.staffCount;
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
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search branches by name, manager, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* Filters */}
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
          /* Branches Dashboard Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBranches.map((branch: BranchSummary) => {
              const isCurrent = branch.id === currentBranch?.id;
              const info = getInfo(branch.id, branch.name);

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
                      <span className="text-[10px] text-fg-subtle font-mono block mt-0.5">slug: {branch.slug}</span>
                    </div>

                    {/* Status Dot */}
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

                  {/* Manager & Address Details */}
                  <div className="space-y-1.5 text-[11.5px] text-fg-muted font-normal border-t border-b border-white/5 py-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-fg-subtle" />
                      <span>
                        Manager: <strong className="text-fg">{info.manager}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-fg-subtle" />
                      <span className="truncate" title={info.address}>
                        {info.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-fg-subtle" />
                      <span>{info.openingHours}</span>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2 text-center bg-white/5 p-2.5 rounded-lg mb-4 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">Orders Today</span>
                      <span className="text-[13px] font-bold text-fg num">{info.todayOrders}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-l border-white/5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">Active Staff</span>
                      <span className="text-[13px] font-bold text-fg num">{info.staffCount}</span>
                    </div>
                  </div>

                  {/* Actions area */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                    {/* Open Branch CTA */}
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

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(branch)}
                      title="Edit branch details"
                      className="h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-white/5 hover:text-fg transition-colors border border-white/10 shrink-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Activate/Deactivate Toggle */}
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

      {/* explanatory menu warning */}
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
          <div className="w-full max-w-[420px] rounded-xl border border-border bg-[#0F0F10] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150 text-fg">
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
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Sort Order (Optional)</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="e.g. 1"
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
          <div className="w-full max-w-[480px] rounded-xl border border-border bg-[#0F0F10] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150 text-fg overflow-y-auto max-h-[90vh]">
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

              {/* Group 1: General Info */}
              <div className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                  General Info
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
                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Sort Order *</label>
                    <Input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      placeholder="e.g. 1"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Contact Info */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                  Contact details
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Physical Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main Road, Block A"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Phone</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765..."
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. branch@steward.app"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Operations & Hours */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                  Operations & Timing
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Opening Hours</label>
                    <Input
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      placeholder="e.g. 09:00 AM - 11:00 PM"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Assigned Manager</label>
                    <select
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      className="w-full h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg outline-none focus:border-white/20 transition-colors cursor-pointer"
                    >
                      <option value="John Doe">John Doe</option>
                      <option value="Jane Smith">Jane Smith</option>
                      <option value="David Lee">David Lee</option>
                    </select>
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
