import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  MoreHorizontal,
  Copy,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ModifierGroupForm } from "./ModifierGroupForm";
import { ModifierOptionForm } from "./ModifierOptionForm";
import { ModifierOptionsSection } from "./ModifierOptionsSection";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { DropResult } from "@hello-pangea/dnd";
import type { ModifierGroup, ModifierOption, ApiSuccess } from "@/types";

export function ModifiersTab() {
  const queryClient = useQueryClient();

  // Search, Filter, Sort States
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "displayOrder">("displayOrder");

  // Expanded group ID for Options Configuration Subview
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Sheets Control
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [optionSheetOpen, setOptionSheetOpen] = useState(false);

  // Edit / Action targets
  const [editGroup, setEditGroup] = useState<ModifierGroup | undefined>();
  const [deleteGroup, setDeleteGroup] = useState<ModifierGroup | undefined>();
  const [editOption, setEditOption] = useState<ModifierOption | undefined>();
  const [deleteOptionId, setDeleteOptionId] = useState<string | undefined>();

  // Fetch groups
  const { data: groups = [], isLoading } = useQuery<ModifierGroup[]>({
    queryKey: ["modifier-groups"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ModifierGroup[]>>("/admin/menu-modifiers/groups");
      return data.data;
    },
  });

  // Group mutations
  const createGroupMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post("/admin/menu-modifiers/groups", payload);
    },
    onSuccess: () => {
      toast.success("Modifier group created");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      setGroupSheetOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create group");
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      await api.put(`/admin/menu-modifiers/groups/${id}`, payload);
    },
    onSuccess: () => {
      toast.success("Modifier group updated");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      setGroupSheetOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update group");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/menu-modifiers/groups/${id}`);
    },
    onSuccess: () => {
      toast.success("Modifier group deleted");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      setDeleteGroup(undefined);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete group");
    },
  });

  // Option mutations
  const createOptionMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post("/admin/menu-modifiers/options", payload);
    },
    onSuccess: () => {
      toast.success("Modifier option created");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      setOptionSheetOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create option");
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      await api.put(`/admin/menu-modifiers/options/${id}`, payload);
    },
    onSuccess: () => {
      toast.success("Modifier option updated");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      setOptionSheetOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update option");
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/menu-modifiers/options/${id}`);
    },
    onSuccess: () => {
      toast.success("Modifier option deleted");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      setDeleteOptionId(undefined);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete option");
    },
  });

  const optionReorderMutation = useMutation({
    mutationFn: async ({ optionId, order }: { optionId: string; order: number }) => {
      await api.put(`/admin/menu-modifiers/options/${optionId}`, {
        displayOrder: order,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
    },
  });

  // Option Drag and drop reordering handler
  const handleOptionReorder = async (result: DropResult) => {
    if (!result.destination || !selectedGroupId) return;
    const currentGroup = groups.find((g: ModifierGroup) => g.id === selectedGroupId);
    if (!currentGroup || !currentGroup.options) return;

    const items: ModifierOption[] = Array.from(currentGroup.options);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updated = items.map((item: ModifierOption, index: number) => ({
      ...item,
      displayOrder: index,
    }));

    // Optimistically update query client state
    queryClient.setQueryData(["modifier-groups"], (prev: any) => {
      if (!prev) return prev;
      return prev.map((g: ModifierGroup) => {
        if (g.id === selectedGroupId) {
          return { ...g, options: updated };
        }
        return g;
      });
    });

    try {
      for (let i = 0; i < updated.length; i++) {
        await optionReorderMutation.mutateAsync({
          optionId: updated[i].id,
          order: i,
        });
      }
      toast.success("Reordered modifier options");
    } catch {
      toast.error("Failed to persist new options order");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
    }
  };

  const handleDuplicate = async (group: ModifierGroup) => {
    try {
      // Create duplicate group
      const newGroupData = await api.post<ApiSuccess<ModifierGroup>>("/admin/menu-modifiers/groups", {
        name: `${group.name} (Copy)`,
        description: group.description ?? undefined,
        displayOrder: group.displayOrder + 1,
        active: group.active,
      });
      const newGroupId = newGroupData.data.data.id;

      // Copy options
      if (group.options && group.options.length > 0) {
        for (const opt of group.options) {
          await api.post("/admin/menu-modifiers/options", {
            modifierGroupId: newGroupId,
            name: opt.name,
            priceAdjustment: parseFloat(opt.priceAdjustment),
            displayOrder: opt.displayOrder,
            active: opt.active,
          });
        }
      }

      toast.success("Duplicated modifier group and options");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
    } catch {
      toast.error("Failed to duplicate group");
    }
  };

  const handleToggleGroupActive = async (group: ModifierGroup) => {
    try {
      await api.put(`/admin/menu-modifiers/groups/${group.id}`, {
        active: !group.active,
      });
      toast.success(group.active ? "Modifier group deactivated" : "Modifier group activated");
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Search / Filters pipeline
  const filteredGroups = groups
    .filter((g: ModifierGroup) => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || 
        (g.description && g.description.toLowerCase().includes(search.toLowerCase()));
      const matchActive = activeFilter === "all" ? true : activeFilter === "active" ? g.active : !g.active;
      return matchSearch && matchActive;
    })
    .sort((a: ModifierGroup, b: ModifierGroup) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.displayOrder - b.displayOrder;
    });

  const selectedGroup = groups.find((g: ModifierGroup) => g.id === selectedGroupId);

  return (
    <div className="space-y-4">
      {/* Search / Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-fg-subtle" />
          <Input
            placeholder="Search modifier groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#111112] border-white/5 text-[12px] h-10 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#111112] border border-white/5 rounded-lg p-1">
            {(["all", "active", "inactive"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "text-[11px] font-medium px-3 py-1 rounded-md transition-colors capitalize",
                  activeFilter === filter ? "bg-white/10 text-fg" : "text-fg-subtle hover:text-fg"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 border-white/5 text-[12px]">
                Sort By <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
              <DropdownMenuItem onClick={() => setSortBy("displayOrder")}>Display Order</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>Alphabetical</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={() => {
              setEditGroup(undefined);
              setGroupSheetOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Group
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups table column */}
        <div className="lg:col-span-2 border border-white/5 bg-[#0a0a0b] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full bg-white/5" />
              <Skeleton className="h-12 w-full bg-white/5" />
              <Skeleton className="h-12 w-full bg-white/5" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-fg-subtle">
              No modifier groups found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-b border-white/5">
                  <TableHead className="text-[11px] text-fg-muted font-medium py-3">Name</TableHead>
                  <TableHead className="text-[11px] text-fg-muted font-medium py-3">Options</TableHead>
                  <TableHead className="text-[11px] text-fg-muted font-medium py-3">Menu Link</TableHead>
                  <TableHead className="text-[11px] text-fg-muted font-medium py-3">Status</TableHead>
                  <TableHead className="text-[11px] text-fg-muted font-medium py-3 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((g: ModifierGroup) => (
                  <TableRow
                    key={g.id}
                    className={cn(
                      "border-b border-white/5 transition-colors cursor-pointer",
                      selectedGroupId === g.id ? "bg-white/5" : "hover:bg-white/5"
                    )}
                    onClick={() => setSelectedGroupId(g.id)}
                  >
                    <TableCell className="py-3">
                      <div className="text-[12px] font-medium text-fg">{g.name}</div>
                      {g.description && <div className="text-[10px] text-fg-subtle mt-0.5">{g.description}</div>}
                    </TableCell>
                    <TableCell className="py-3 text-[12px] text-fg">
                      {g.options?.length || 0} options
                    </TableCell>
                    <TableCell className="py-3 text-[12px] text-fg">
                      {g.menuItems?.length || 0} item(s)
                    </TableCell>
                    <TableCell className="py-3">
                      {g.active ? (
                        <Badge className="bg-success/10 text-success border-none text-[9px] px-1.5 py-0 shadow-none">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-white/5 text-fg-subtle border-none text-[9px] px-1.5 py-0 shadow-none">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-fg-subtle">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditGroup(g);
                              setGroupSheetOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(g)}>
                            <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate Group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleGroupActive(g)}>
                            <ExternalLink className="mr-2 h-3.5 w-3.5" /> {g.active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteGroup(g)} className="text-danger focus:bg-danger/10">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Options configuration details subview */}
        <div className="border border-white/5 bg-[#0a0a0b] rounded-xl p-4">
          {selectedGroup ? (
            <ModifierOptionsSection
              options={selectedGroup.options || []}
              onReorder={handleOptionReorder}
              onEdit={(opt) => {
                setEditOption(opt);
                setOptionSheetOpen(true);
              }}
              onDelete={(optId) => setDeleteOptionId(optId)}
              onAddClick={() => {
                setEditOption(undefined);
                setOptionSheetOpen(true);
              }}
              onToggleActive={async (opt) => {
                try {
                  await api.put(`/admin/menu-modifiers/options/${opt.id}`, { active: !opt.active });
                  toast.success(opt.active ? "Option disabled" : "Option enabled");
                  queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
                } catch {
                  toast.error("Failed to toggle option status");
                }
              }}
            />
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-center text-fg-subtle text-[12px] space-y-2">
              <ChevronRight className="h-5 w-5 text-fg-subtle/40 rotate-90" />
              <span>Select a modifier group to configure its options and view details.</span>
            </div>
          )}
        </div>
      </div>

      {/* Sheets & Dialogs */}
      <Sheet open={groupSheetOpen} onOpenChange={setGroupSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10]">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-fg font-semibold">
              {editGroup ? "Edit Modifier Group" : "Create Modifier Group"}
            </SheetTitle>
          </SheetHeader>
          <ModifierGroupForm
            group={editGroup}
            onSubmit={async (values) => {
              if (editGroup) {
                await updateGroupMutation.mutateAsync({ id: editGroup.id, payload: values });
              } else {
                await createGroupMutation.mutateAsync(values);
              }
            }}
            onCancel={() => setGroupSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={optionSheetOpen} onOpenChange={setOptionSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10]">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-fg font-semibold">
              {editOption ? "Edit Modifier Option" : "Add Modifier Option"}
            </SheetTitle>
          </SheetHeader>
          <ModifierOptionForm
            option={editOption}
            onSubmit={async (values) => {
              if (editOption) {
                await updateOptionMutation.mutateAsync({ id: editOption.id, payload: values });
              } else if (selectedGroupId) {
                await createOptionMutation.mutateAsync({ modifierGroupId: selectedGroupId, ...values });
              }
            }}
            onCancel={() => setOptionSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Dialog for deleting Modifier Group */}
      <AlertDialog open={!!deleteGroup} onOpenChange={(o) => !o && setDeleteGroup(undefined)}>
        <AlertDialogContent className="border border-white/5 bg-[#0F0F10]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-fg">Delete Modifier Group?</AlertDialogTitle>
            <AlertDialogDescription className="text-fg-subtle">
              Are you sure you want to delete &ldquo;{deleteGroup?.name}&rdquo;?
              {deleteGroup?.menuItems && deleteGroup.menuItems.length > 0 && (
                <span className="block mt-2 text-danger font-semibold">
                  WARNING: This group is currently attached to {deleteGroup.menuItems.length} menu item(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:bg-white/5 text-fg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => deleteGroup && deleteGroupMutation.mutate(deleteGroup.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for deleting Modifier Option */}
      <AlertDialog open={!!deleteOptionId} onOpenChange={(o) => !o && setDeleteOptionId(undefined)}>
        <AlertDialogContent className="border border-white/5 bg-[#0F0F10]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-fg">Delete Modifier Option?</AlertDialogTitle>
            <AlertDialogDescription className="text-fg-subtle">
              Are you sure you want to delete this option? This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:bg-white/5 text-fg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => deleteOptionId && deleteOptionMutation.mutate(deleteOptionId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
