"use client";

import React, { useState, useMemo } from "react";
import {
  useInventoryCategories,
  useCreateInventoryCategory,
  useUpdateInventoryCategory,
  useDeleteInventoryCategory,
  InventoryCategory,
} from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layers,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
  Archive,
  Layers3,
  Calendar,
  Clock,
  Eye,
  Settings,
  Info,
  ArchiveX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

export function InventoryCategoriesView() {
  const { data: categories = [], isLoading, error } = useInventoryCategories();

  const createMutation = useCreateInventoryCategory();
  const updateMutation = useUpdateInventoryCategory();
  const deleteMutation = useDeleteInventoryCategory();

  // Search, filter, and sorting states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sortOrderAsc");

  // Drawer (Sheet) state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [editItem, setEditItem] = useState<InventoryCategory | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);

  // Predefined gorgeous colors for the category badge indicators
  const presetColors = [
    { value: "#10B981", name: "Emerald Green" },
    { value: "#EF4444", name: "Crimson Red" },
    { value: "#3B82F6", name: "Ocean Blue" },
    { value: "#F59E0B", name: "Amber Orange" },
    { value: "#8B5CF6", name: "Amethyst Purple" },
    { value: "#EC4899", name: "Bubblegum Pink" },
    { value: "#06B6D4", name: "Cyan Teal" },
    { value: "#6B7280", name: "Slate Gray" }
  ];

  // Open Create Drawer
  const handleOpenCreate = () => {
    setEditItem(null);
    setIsReadOnly(false);
    setFormName("");
    setFormDescription("");
    setFormColor("#3B82F6");
    setFormSortOrder("0");
    setFormIsActive(true);
    setSheetOpen(true);
  };

  // Open Edit / View Drawer
  const handleOpenEdit = (item: InventoryCategory, readOnly = false) => {
    setEditItem(item);
    setIsReadOnly(readOnly);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormColor(item.color || "#3B82F6");
    setFormSortOrder((item.sortOrder || 0).toString());
    setFormIsActive(item.isActive);
    setSheetOpen(true);
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    const payload = {
      name: formName,
      description: formDescription,
      color: formColor,
      sortOrder: parseInt(formSortOrder) || 0,
      isActive: formIsActive
    };

    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          ...payload
        });
        toast.success("Category updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Category created successfully");
      }
      setSheetOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Operation failed");
    }
  };

  // Delete Category
  const handleDelete = async (item: InventoryCategory) => {
    // Front-end constraint validation: prevent deleting if containing items
    if ((item.ingredientCount || 0) > 0) {
      toast.error(
        `Cannot delete "${item.name}" category because it still contains ${item.ingredientCount} ingredient(s). Please move these ingredients first or archive this category.`,
        { duration: 6000 }
      );
      return;
    }

    if (confirm(`Are you sure you want to permanently delete the category "${item.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
        toast.success("Category deleted successfully");
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete category");
      }
    }
  };

  // Toggle Category Active Status (Archive)
  const handleToggleArchive = async (item: InventoryCategory) => {
    const actionWord = item.isActive ? "archive" : "restore";
    if (confirm(`Are you sure you want to ${actionWord} the category "${item.name}"?`)) {
      try {
        await updateMutation.mutateAsync({
          id: item.id,
          isActive: !item.isActive
        });
        toast.success(`Category ${actionWord}d successfully`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to update category status");
      }
    }
  };

  // Filters & Search logic
  const filteredCategories = useMemo(() => {
    return categories
      .filter((item: InventoryCategory) => {
        const term = search.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(term) || (item.description && item.description.toLowerCase().includes(term));

        let matchesStatus = true;
        if (statusFilter === "ACTIVE") matchesStatus = item.isActive;
        if (statusFilter === "ARCHIVED") matchesStatus = !item.isActive;

        return matchesSearch && matchesStatus;
      })
      .sort((a: InventoryCategory, b: InventoryCategory) => {
        if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
        if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
        if (sortBy === "mostUsed") return (b.ingredientCount || 0) - (a.ingredientCount || 0);
        if (sortBy === "leastUsed") return (a.ingredientCount || 0) - (b.ingredientCount || 0);
        return (a.sortOrder || 0) - (b.sortOrder || 0); // default sortOrderAsc
      });
  }, [categories, search, statusFilter, sortBy]);

  // Derived KPI Counts
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: InventoryCategory) => c.isActive).length;
  const archivedCategories = categories.filter((c: InventoryCategory) => !c.isActive).length;
  const totalIngredientsAssigned = categories.reduce((sum: number, c: InventoryCategory) => sum + (c.ingredientCount || 0), 0);

  const hasActiveFilters = !!(search || statusFilter !== "all" || sortBy !== "sortOrderAsc");

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Catalog Schema</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Inventory Categories</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Establish groups to categorize raw ingredients and structure stock control catalogs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 h-9 cursor-pointer rounded-xl transition-all active:scale-[0.98]"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-white/5 text-fg-muted">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Total Categories</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-0.5">{totalCategories}</span>}
          </div>
        </div>

        {/* KPI: Active */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-success/10 text-success">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Active Categories</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-success mt-0.5">{activeCategories}</span>}
          </div>
        </div>

        {/* KPI: Archived */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-white/5 text-fg-muted">
            <Archive className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Archived Categories</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg-muted mt-0.5">{archivedCategories}</span>}
          </div>
        </div>

        {/* KPI: Assigned Ingredients */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Layers3 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Ingredients Assigned</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-0.5">{totalIngredientsAssigned}</span>}
          </div>
        </div>
      </div>

      {/* Toolbar Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#141416] border border-white/10 rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[130px]"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ARCHIVED">Archived Only</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[130px]"
          >
            <option value="sortOrderAsc">Display Order</option>
            <option value="nameAsc">Name (A-Z)</option>
            <option value="nameDesc">Name (Z-A)</option>
            <option value="mostUsed">Most Used</option>
            <option value="leastUsed">Least Used</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-xs px-3 hover:bg-white/5 text-fg-subtle hover:text-fg cursor-pointer rounded-xl"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setSortBy("sortOrderAsc");
              }}
            >
              <X className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 text-danger border border-danger/20 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load categories catalog. Please verify backend database state.</span>
        </div>
      )}

      {/* Table grid */}
      <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
            <Layers className="w-10 h-10 text-fg-subtle opacity-50 mb-1" />
            <p className="text-sm font-medium text-fg">No categories found.</p>
            <p className="text-xs text-fg-subtle font-normal">Organize your ingredient catalog by creating your first category.</p>
            <Button size="sm" className="mt-2.5 gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground cursor-pointer rounded-xl h-9 px-4 font-semibold" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-center">
            <p className="text-sm font-semibold text-fg">No categories match your filter criteria.</p>
            <p className="text-xs text-fg-subtle">Try modifying your text search or resetting filters.</p>
            <Button size="sm" variant="secondary" className="mt-2.5 cursor-pointer rounded-xl" onClick={() => { setSearch(""); setStatusFilter("all"); setSortBy("sortOrderAsc"); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle w-16">Color</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Category Name</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Description</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ingredients Assigned</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Last Updated</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((item: InventoryCategory) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                    <TableCell className="py-3">
                      <div
                        className="w-4.5 h-4.5 rounded-full border border-white/10 shadow-sm"
                        style={{ backgroundColor: item.color || "#3B82F6" }}
                        title={item.color || "Default Blue"}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-fg">{item.name}</span>
                        {item.sortOrder !== undefined && (
                          <span className="text-[10px] text-fg-subtle mt-0.5 font-medium">Display Index: {item.sortOrder}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted max-w-[250px] truncate">
                      {item.description || <span className="italic opacity-50">No description provided</span>}
                    </TableCell>
                    <TableCell className="py-3 text-sm font-bold text-fg font-mono">
                      {item.ingredientCount || 0}
                    </TableCell>
                    <TableCell className="py-3">
                      {item.isActive ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/15 border-none text-[10px] font-bold py-0.5 px-2 rounded-full">Active</Badge>
                      ) : (
                        <Badge className="bg-white/5 text-fg-muted hover:bg-white/10 border-none text-[10px] font-bold py-0.5 px-2 rounded-full">Archived</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "Just now"}
                    </TableCell>
                    <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item, true)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item, false)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(item)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                          title={item.isActive ? "Archive Category" : "Restore Category"}
                        >
                          {item.isActive ? <Archive className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/10 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Sheet Category Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-l-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              {isReadOnly ? "View Category Details" : editItem ? "Edit Category Details" : "Create Inventory Category"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6 p-6">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Info className="w-3.5 h-3.5" /> Basic Information
              </div>

              {/* Category Name */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Category Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Greens, Premium Beef, Dairy Goods"
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl focus:border-white/20"
                  disabled={isReadOnly}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Description</Label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe what items are included in this category classification..."
                  className="w-full min-h-[80px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20"
                  disabled={isReadOnly}
                />
              </div>

              {/* Display Color Preset Selection */}
              <div className="space-y-2">
                <Label className="text-[11px] text-fg-muted">Badge Display Color</Label>
                {isReadOnly ? (
                  <div className="flex items-center gap-2.5 bg-[#141416] p-2.5 rounded-xl border border-white/5">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: formColor }} />
                    <span className="text-xs font-mono">{formColor}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={cn(
                          "w-7 h-7 rounded-full border border-white/10 shadow-sm transition-transform active:scale-95 cursor-pointer relative",
                          formColor === color.value && "ring-2 ring-accent ring-offset-2 ring-offset-[#0F0F10] scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Display Order (Priority) */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Display Sorting Order (Index)</Label>
                <Input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  placeholder="0"
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                  disabled={isReadOnly}
                />
                <span className="text-[9.5px] text-fg-muted block mt-1">
                  Determines the sorting weight of this category in selection dropdowns and inventory lists.
                </span>
              </div>
            </div>

            {/* Section 2: Settings (Status toggle) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Settings className="w-3.5 h-3.5" /> Category Settings
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Status</Label>
                <select
                  value={formIsActive ? "active" : "archived"}
                  onChange={(e) => setFormIsActive(e.target.value === "active")}
                  className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors"
                  disabled={isReadOnly}
                >
                  <option value="active">Active (Available for binding ingredients)</option>
                  <option value="archived">Archived (Catalog out-of-use)</option>
                </select>
              </div>
            </div>

            {/* Section 3: Read-Only Statistics */}
            {editItem && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                  <ArchiveX className="w-3.5 h-3.5" /> Statistics & Audit
                </div>

                <div className="space-y-3.5 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-[11px] text-fg-subtle">
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted flex items-center gap-1"><Layers3 className="w-3 h-3" /> Associated Ingredients:</span>
                    <span className="font-bold text-fg font-mono">{editItem.ingredientCount || 0}</span>
                  </div>
                  {editItem.createdAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-fg-muted flex items-center gap-1"><Calendar className="w-3 h-3" /> Created At:</span>
                      <span>{new Date(editItem.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                  {editItem.updatedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-fg-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Last Modified:</span>
                      <span>{new Date(editItem.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4 cursor-pointer">
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4 cursor-pointer" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editItem ? "Save Changes" : "Create Category"}
                </Button>
              )}
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
