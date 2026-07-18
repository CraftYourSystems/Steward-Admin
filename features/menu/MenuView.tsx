"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  ImageIcon,
  Search,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Activity,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { MenuItemForm } from "@/components/menu/MenuItemForm";
import { CategoryForm } from "@/components/menu/CategoryForm";
import { formatCurrency, cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import type { MenuItem, Category, ApiSuccess, PaginationMeta } from "@/types";

const KITCHEN_TYPE_LABELS: Record<string, string> = {
  MAIN: "Main",
  TIME_TAKING: "Time Taking",
  READY_TO_SERVE: "Ready",
};

// ─── Menu Items Tab ───────────────────────────────────────────────────────────
interface MenuItemsTabProps {
  categories: Category[];
  onAddRef: React.MutableRefObject<() => void>;
}

function MenuItemsTab({ categories, onAddRef }: MenuItemsTabProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>();
  const [deleteItem, setDeleteItem] = useState<MenuItem | undefined>();

  // Filter States
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sortOrder");

  // Collapse Category States
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("steward-collapsed-categories");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => {
      const updated = { ...prev, [catId]: !prev[catId] };
      try {
        localStorage.setItem("steward-collapsed-categories", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["menu-items", page],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(
        "/menu/admin/items",
        { params: { page, limit: 50 } }
      );
      return data;
    },
  });

  useEffect(() => {
    onAddRef.current = () => {
      setEditItem(undefined);
      setSheetOpen(true);
    };
  }, [onAddRef]);

  const items: MenuItem[] = data?.data ?? [];
  const meta = data?.meta;

  // Overview metrics calculations
  const { activeItems, unavailableItems, avgPrice, healthStatus, healthReason } = useMemo(() => {
    const active = items.filter((i) => i.isAvailable).length;
    const unavailable = items.filter((i) => !i.isAvailable).length;
    const totalP = items.reduce((acc, i) => acc + parseFloat(i.price as string || "0"), 0);
    const avg = items.length > 0 ? totalP / items.length : 0;

    // Catalog Health Readiness check
    const uncategorizedItems = items.filter(
      (item) => !item.category || !categories.some((c) => c.id === item.category.id)
    );
    const zeroPriceItems = items.filter((item) => parseFloat(item.price as string || "0") === 0);

    const isHealthy = uncategorizedItems.length === 0 && zeroPriceItems.length === 0;
    const status = isHealthy ? "Ready" : "Needs Review";

    let reason = "All items fully configured.";
    if (!isHealthy) {
      const parts = [];
      if (uncategorizedItems.length > 0) {
        parts.push(`${uncategorizedItems.length} uncategorized`);
      }
      if (zeroPriceItems.length > 0) {
        parts.push(`${zeroPriceItems.length} zero-price`);
      }
      reason = `${parts.join(" & ")} require setup.`;
    }

    return { activeItems: active, unavailableItems: unavailable, avgPrice: avg, healthStatus: status, healthReason: reason };
  }, [items, categories]);

  const toggleMutation = useMutation({
    mutationFn: async ({ item, isAvailable }: { item: MenuItem; isAvailable: boolean }) => {
      const { data } = await api.patch<ApiSuccess<MenuItem>>(
        `/menu/admin/items/${item.id}/availability`,
        { isAvailable }
      );
      return data.data;
    },
    onMutate: async ({ item, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: ["menu-items", page] });
      const previousData = queryClient.getQueryData<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(["menu-items", page]);

      if (previousData) {
        queryClient.setQueryData<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(
          ["menu-items", page],
          {
            ...previousData,
            data: previousData.data.map((i) =>
              i.id === item.id ? { ...i, isAvailable } : i
            ),
          }
        );
      }
      return { previousData };
    },
    onSuccess: (updatedItem) => {
      toast.success(
        `${updatedItem.name} marked ${updatedItem.isAvailable ? "available" : "unavailable"}`
      );
      queryClient.setQueryData<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(
        ["menu-items", page],
        (old: (ApiSuccess<MenuItem[]> & { meta: PaginationMeta }) | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((current: MenuItem) => (current.id === updatedItem.id ? updatedItem : current)),
          };
        }
      );
    },
    onError: (error: unknown, { item: _item, isAvailable: _isAvailable }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["menu-items", page], context.previousData);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to update availability");
    },
  });

  const handleAvailabilityToggle = (item: MenuItem, isAvailable: boolean) => {
    toggleMutation.mutate({ item, isAvailable });
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/menu/admin/items/${deleteItem.id}`);
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to delete item");
    } finally {
      setDeleteItem(undefined);
    }
  };

  // Filter Items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || item.category?.id === categoryFilter;

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" ? item.isAvailable : !item.isAvailable);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Sort Items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "priceAsc") return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === "priceDesc") return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === "prepTime") return a.prepTimeMins - b.prepTimeMins;
    return a.sortOrder - b.sortOrder;
  });

  // Group Items by Category (Including Empty Categories)
  const itemsByCategory = useMemo(() => {
    const groups = categories.map((cat) => {
      const catItems = sortedItems.filter((item) => item.category?.id === cat.id);
      return {
        category: cat,
        items: catItems,
      };
    });

    const uncategorizedItems = sortedItems.filter(
      (item) => !item.category || !categories.some((c) => c.id === item.category.id)
    );
    if (uncategorizedItems.length > 0) {
      groups.push({
        category: { id: "uncategorized", name: "Uncategorized", description: "", sortOrder: 999, restaurantId: "" },
        items: uncategorizedItems,
      });
    }
    return groups;
  }, [categories, sortedItems]);

  const expandAll = () => {
    setCollapsedCategories({});
    try {
      localStorage.removeItem("steward-collapsed-categories");
    } catch {}
  };

  const collapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    itemsByCategory.forEach((group) => {
      collapsed[group.category.id] = true;
    });
    setCollapsedCategories(collapsed);
    try {
      localStorage.setItem("steward-collapsed-categories", JSON.stringify(collapsed));
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Overview Cards Ribbon */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Active Items</span>
            <span className="text-xl font-black text-success num mt-1">{activeItems}</span>
          </div>
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Unavailable Items</span>
            <span className="text-xl font-black text-white/50 num mt-1">{unavailableItems}</span>
          </div>
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Categories</span>
            <span className="text-xl font-black text-fg num mt-1">{categories.length}</span>
          </div>
          <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Average Price</span>
            <span className="text-xl font-black text-fg num mt-1">{formatCurrency(avgPrice)}</span>
          </div>
          <div className={cn("col-span-2 lg:col-span-1 flex flex-col p-4 rounded-2xl border justify-center", healthStatus === "Ready" ? "border-success/20 bg-success/5 text-success" : "border-warning/20 bg-warning/5 text-warning")}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 select-none">Catalog Health</span>
              {healthStatus === "Ready" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[15.5px] font-black tracking-tight mt-1">{healthStatus.toUpperCase()}</span>
            <span className="text-[10px] opacity-75 mt-0.5 font-normal truncate">{healthReason}</span>
          </div>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
            <input
              type="text"
              placeholder="Search items by name, category, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="sortOrder">Sort Order</option>
              <option value="name">Name (A-Z)</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="prepTime">Prep Time</option>
            </select>

            <div className="flex items-center gap-1.5 border-l border-white/5 pl-2 ml-1">
              <Button variant="secondary" size="sm" className="h-8 text-[11px] px-2.5 bg-white/5 hover:bg-white/10 border-white/10" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="secondary" size="sm" className="h-8 text-[11px] px-2.5 bg-white/5 hover:bg-white/10 border-white/10" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="card-premium overflow-hidden border border-white/5 rounded-xl bg-white/[0.01]">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md bg-white/5" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] text-fg-muted">Failed to load menu items.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 border border-white/10">
              <UtensilsCrossed className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">Your menu is empty.</p>
            <p className="text-[11px] text-fg-subtle">Start by creating your first menu item.</p>
            <Button size="sm" className="gap-1.5 mt-1" onClick={() => { setEditItem(undefined); setSheetOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] font-semibold text-fg">No menu items match your current search.</p>
            <p className="text-[11px] text-fg-subtle">Try adjusting your search or clearing filters.</p>
            <Button size="sm" variant="secondary" className="mt-1" onClick={() => { setSearch(""); setCategoryFilter("all"); setAvailabilityFilter("all"); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                  <TableHead className="h-9 w-14 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Availability</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Name</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Price</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Category</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Kitchen Station</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Prep Time</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsByCategory.map((group) => {
                  const isCollapsed = !!collapsedCategories[group.category.id];
                  return (
                    <React.Fragment key={group.category.id}>
                      {/* Collapsible Category Header Row */}
                      <TableRow
                        className="bg-white/[0.02] border-y border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors"
                        onClick={() => toggleCategory(group.category.id)}
                      >
                        <TableCell colSpan={7} className="py-2.5 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4 text-fg-subtle" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-fg-subtle" />
                              )}
                              <span className="font-bold text-fg text-[13px]">{group.category.name}</span>
                            </div>
                            <span className="text-[10px] text-fg-muted font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                              {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Items loop */}
                      {!isCollapsed && (
                        group.items.length === 0 ? (
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableCell colSpan={7} className="py-4 text-center text-xs text-fg-subtle italic">
                              No items in this category yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          group.items.map((item: MenuItem) => (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                              <TableCell className="py-2.5">
                                <Switch
                                  checked={item.isAvailable}
                                  onCheckedChange={(v) => handleAvailabilityToggle(item, v)}
                                />
                              </TableCell>
                              <TableCell className="py-2.5">
                                <div className="flex items-center gap-2.5">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="h-8 w-8 rounded-lg object-cover border border-white/10" />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                                      <ImageIcon className="h-3.5 w-3.5 text-fg-subtle" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[12.5px] font-semibold text-fg">{item.name}</span>
                                    {item.description && <span className="text-[10px] text-fg-subtle mt-0.5 line-clamp-1">{item.description}</span>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5 text-[12px] font-bold text-fg num">
                                {formatCurrency(item.price)}
                              </TableCell>
                              <TableCell className="py-2.5 text-[12px] text-fg-muted">
                                {item.category?.name || "Uncategorized"}
                              </TableCell>
                              <TableCell className="py-2.5">
                                <span className="text-[11px] font-medium text-fg-subtle uppercase px-2 py-0.5 bg-white/5 border border-white/5 rounded">
                                  {KITCHEN_TYPE_LABELS[item.kitchenType] ?? item.kitchenType}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5 text-[12.5px] text-fg-muted num">
                                {item.prepTimeMins} min
                              </TableCell>
                              <TableCell className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => { setEditItem(item); setSheetOpen(true); }}
                                    className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[140px] bg-[#0F0F10] border-white/5">
                                      <DropdownMenuItem
                                        onClick={() => setDeleteItem(item)}
                                        className="text-[12px] text-danger focus:text-danger focus:bg-danger/10 hover:bg-danger/5 cursor-pointer"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete Item</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit sheet & Delete dialog */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto border-l border-white/5 bg-[#0F0F10]">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-fg font-semibold">{editItem ? "Edit Menu Item" : "Add Menu Item"}</SheetTitle>
          </SheetHeader>
          <MenuItemForm
            item={editItem}
            categories={categories}
            onSuccess={() => {
              setSheetOpen(false);
              queryClient.invalidateQueries({ queryKey: ["menu-items"] });
            }}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(undefined)}>
        <AlertDialogContent className="border border-white/5 bg-[#0F0F10]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-fg">Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription className="text-fg-subtle">
              &ldquo;{deleteItem?.name}&rdquo; will be permanently deleted or marked unavailable if it has order history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:bg-white/5 text-fg">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger text-white hover:bg-danger/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
interface CategoriesTabProps {
  onAddRef: React.MutableRefObject<() => void>;
}

function CategoriesTab({ onAddRef }: CategoriesTabProps) {
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((s) => s.user?.restaurantId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | undefined>();
  const [deleteCat, setDeleteCat] = useState<Category | undefined>();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Category[]>>(`/menu/admin/categories`);
      return data.data;
    },
    enabled: !!restaurantId,
  });

  useEffect(() => {
    onAddRef.current = () => {
      setEditCat(undefined);
      setSheetOpen(true);
    };
  }, [onAddRef]);

  const handleDelete = async () => {
    if (!deleteCat) return;
    try {
      await api.delete(`/menu/admin/categories/${deleteCat.id}`);
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: { code?: string } } } };
      if (e?.response?.data?.error?.code === "CONFLICT") {
        toast.error("Remove all items from this category first.");
      } else {
        toast.error(e?.response?.data?.message ?? "Failed to delete category");
      }
    } finally {
      setDeleteCat(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-fg-subtle font-medium">
          {categories.length > 0 ? `${categories.length} categories` : "No categories"}
        </p>
      </div>

      <div className="card-premium overflow-hidden border border-white/5 rounded-xl bg-white/[0.01]">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md bg-white/5" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 border border-white/10">
              <UtensilsCrossed className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No categories yet</p>
            <p className="text-[11px] text-fg-subtle">Start by creating your first category.</p>
            <Button size="sm" className="gap-1.5 mt-1" onClick={() => setSheetOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Name</TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Description</TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Sort Order</TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat: Category) => (
                <TableRow key={cat.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                  <TableCell className="py-2.5 text-[13px] font-medium text-fg">{cat.name}</TableCell>
                  <TableCell className="py-2.5 text-[12px] text-fg-muted">{cat.description ?? "—"}</TableCell>
                  <TableCell className="py-2.5 text-[12px] text-fg-muted num">{cat.sortOrder}</TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditCat(cat); setSheetOpen(true); }}
                        className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[140px] bg-[#0F0F10] border-white/5">
                          <DropdownMenuItem
                            onClick={() => setDeleteCat(cat)}
                            className="text-[12px] text-danger focus:text-danger focus:bg-danger/10 hover:bg-danger/5 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10]">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-fg font-semibold">{editCat ? "Edit Category" : "Add Category"}</SheetTitle>
          </SheetHeader>
          <CategoryForm
            category={editCat}
            onSuccess={() => {
              setSheetOpen(false);
              queryClient.invalidateQueries({ queryKey: ["categories"] });
            }}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteCat} onOpenChange={(o) => !o && setDeleteCat(undefined)}>
        <AlertDialogContent className="border border-white/5 bg-[#0F0F10]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-fg">Delete category?</AlertDialogTitle>
            <AlertDialogDescription className="text-fg-subtle">
              &ldquo;{deleteCat?.name}&rdquo; will be permanently deleted. This fails if the category still has items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:bg-white/5 text-fg">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-danger text-white hover:bg-danger/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main MenuView ───────────────────────────────────────────────────────────
export function MenuView() {
  const restaurantId = useAuthStore((s) => s.user?.restaurantId);
  const [activeTab, setActiveTab] = useState("items");

  const itemAddRef = useRef<() => void>(() => {});
  const categoryAddRef = useRef<() => void>(() => {});

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Category[]>>(`/menu/admin/categories`);
      return data.data;
    },
    enabled: !!restaurantId,
  });

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1.5 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs mb-1">Catalog Management</div>
          <h2 className="text-xl font-bold tracking-tight text-fg">Menu Control</h2>
          <p className="text-[12px] text-fg-subtle mt-0.5">Maintain items, prices, stations, and groups.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "items" ? (
            <Button size="sm" className="gap-1.5" onClick={() => itemAddRef.current?.()}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5" onClick={() => categoryAddRef.current?.()}>
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-white/5 p-1 rounded-xl mb-5 border border-white/5">
          {[
            { value: "items", label: "Menu Items" },
            { value: "categories", label: "Categories" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[12px] font-medium data-[state=active]:bg-white/10 data-[state=active]:text-fg rounded-lg px-4 py-1.5 transition-colors shadow-none data-[state=active]:shadow-none cursor-pointer"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="items">
          <MenuItemsTab categories={categories} onAddRef={itemAddRef} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab onAddRef={categoryAddRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
