"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Edit2, CheckCircle2, AlertTriangle, Loader2, Info, MapPin, X, ChevronRight
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsShell, SettingsSection } from "./SettingsShell";
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

  // Form Field States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
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
    setName(branch.name);
    setSlug(branch.slug);
    setSortOrder(branch.sortOrder);
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
  };

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
            <p className="text-[13px] font-semibold text-fg">No branches found</p>
            <p className="text-[11px] text-fg-subtle max-w-[240px]">Create your first branch to start scoping menu operations.</p>
          </div>
        ) : (
          <SettingsSection className="divide-y divide-border/30 px-0">
            {branches.map((branch: BranchSummary) => {
              const isCurrent = branch.id === currentBranch?.id;
              return (
                <div key={branch.id} className="flex items-center justify-between p-4 hover:bg-white/[0.01] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-fg truncate">{branch.name}</span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase tracking-wider">
                          Current
                        </span>
                      )}
                      {branch.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-fg-subtle font-mono">
                      <span>Slug: {branch.slug}</span>
                      <span>•</span>
                      <span>Order: {branch.sortOrder}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => handleOpenEdit(branch)}
                      title="Edit branch details"
                      className="h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors border border-border"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {branch.isActive ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeactivateConfirm(branch)}
                        className="text-danger hover:bg-danger/10 hover:text-danger cursor-pointer"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => activateMutation.mutate(branch.id)}
                        className="text-success hover:bg-success/10 hover:text-success cursor-pointer"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </SettingsSection>
        )}
      </SettingsShell>

      {/* explanatory menu warning */}
      <div className="rounded-xl border border-white/5 bg-surface-2/40 px-4 py-3 flex gap-2.5 items-start">
        <Info className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
        <div className="text-[12px] leading-relaxed text-fg-muted">
          <p className="font-semibold text-fg">Shared Restaurant Properties</p>
          <p className="mt-0.5">Menus, pricing, branding guidelines, and system configurations are currently shared across all Branches. Operations are scoped by the active branch selected in your session context.</p>
        </div>
      </div>

      {/* ── Create Branch Modal ── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
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
              
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Branch Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Second Branch"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Slug (Optional)</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. second-branch"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Sort Order (Optional)</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="e.g. 1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
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
          <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-fg">Edit Branch details</h3>
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
              
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Branch Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Second Branch"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. second-branch"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Sort Order</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="e.g. 1"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditBranch(null)} disabled={editMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending}>
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
          <div className="w-full max-w-[420px] rounded-xl border border-danger/20 bg-surface p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-danger mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-[14px] font-semibold">Deactivate Branch: {deactivateConfirm.name}?</h3>
            </div>
            
            <div className="text-[12px] text-fg-muted space-y-2 leading-relaxed">
              <p>Deactivating this outlet has operational consequences:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>New orders cannot be routed to this branch.</li>
                <li>QR codes matching this branch will stop resolving.</li>
                <li>Active logged-in sessions for this branch will be invalidated.</li>
              </ul>
              <p className="font-semibold text-fg mt-2">Are you sure you want to proceed?</p>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setDeactivateConfirm(null)} disabled={deactivateMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={() => deactivateMutation.mutate(deactivateConfirm.id)} disabled={deactivateMutation.isPending} className="bg-danger hover:bg-danger/90 text-white">
                {deactivateMutation.isPending ? "Deactivating..." : "Deactivate outlet"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
