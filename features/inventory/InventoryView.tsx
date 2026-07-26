"use client";

import React, { useState, useMemo } from "react";
import {
  useInventoryItems,
  useInventoryCategories,
  useSuppliers,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  InventoryItem,
  InventoryCategory,
  Supplier,
} from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
  Layers,
  Building2,
  Archive,
  Barcode,
  Layers3,
  Calendar,
  User,
  Info
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

export function InventoryView() {
  // Query backend data
  const { data: rawStock, isLoading: isLoadingItems, error: itemsError } = useInventoryItems();
  const { data: categories = [], isLoading: isLoadingCategories } = useInventoryCategories();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();

  const stock: InventoryItem[] = rawStock || [];

  // Mutations
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  // Loading state
  const isLoading = isLoadingItems || isLoadingCategories || isLoadingSuppliers;

  // Local state for filters and search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drawer (Sheet) state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formMinStock, setFormMinStock] = useState("10");
  const [formUnit, setFormUnit] = useState("kg");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formStorageLocation, setFormStorageLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Derived Units List
  const units = useMemo(() => {
    return Array.from(new Set(stock.map((i) => i.unit)));
  }, [stock]);

  // Open create drawer
  const handleOpenCreate = () => {
    setEditItem(null);
    setFormName("");
    setFormCategoryId(categories[0]?.id || "");
    setFormStock("0");
    setFormMinStock("10");
    setFormUnit("kg");
    setFormSupplierId(suppliers[0]?.id || "");
    setFormStatus("ACTIVE");
    setFormSku("");
    setFormBarcode("");
    setFormStorageLocation("");
    setFormDescription("");
    setSheetOpen(true);
  };

  // Open edit drawer
  const handleOpenEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormCategoryId(item.categoryId || "");
    setFormStock(item.currentStock.toString());
    setFormMinStock(item.minStock.toString());
    setFormUnit(item.unit);
    setFormSupplierId(item.supplierId || "");
    setFormStatus(item.status);
    setFormSku(item.sku || "");
    setFormBarcode(item.barcode || "");
    setFormStorageLocation(item.storageLocation || "");
    setFormDescription(item.description || "");
    setSheetOpen(true);
  };

  // Submit Drawer Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategoryId || !formSupplierId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      name: formName,
      categoryId: formCategoryId,
      currentStock: parseFloat(formStock) || 0,
      minStock: parseFloat(formMinStock) || 0,
      unit: formUnit,
      supplierId: formSupplierId,
      status: formStatus,
      sku: formSku,
      barcode: formBarcode,
      storageLocation: formStorageLocation,
      description: formDescription,
    };

    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          ...payload,
        });
        toast.success("Ingredient updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Ingredient added successfully");
      }
      setSheetOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    }
  };

  // Delete handler
  const handleDelete = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this ingredient record?")) {
      try {
        await deleteMutation.mutateAsync(itemId);
        toast.success("Ingredient deleted");
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete ingredient");
      }
    }
  };

  // Filter & Search logic
  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const term = search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        (item.sku && item.sku.toLowerCase().includes(term)) ||
        (item.barcode && item.barcode.toLowerCase().includes(term));

      const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
      const matchesSupplier = supplierFilter === "all" || item.supplierId === supplierFilter;
      const matchesUnit = unitFilter === "all" || item.unit === unitFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesSupplier && matchesUnit && matchesStatus;
    });
  }, [stock, search, categoryFilter, supplierFilter, unitFilter, statusFilter]);

  // KPIs
  const totalIngredients = stock.length;
  const activeCount = stock.filter((i) => i.status === "ACTIVE").length;
  const archivedCount = stock.filter((i) => i.status === "ARCHIVED").length;
  const categoriesCount = categories.length;
  const suppliersCount = suppliers.length;

  const hasActiveFilters = !!(
    search ||
    categoryFilter !== "all" ||
    supplierFilter !== "all" ||
    unitFilter !== "all" ||
    statusFilter !== "all"
  );

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Foundational Catalog</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Ingredient Master</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Define, group, and audit foundational ingredient records across category and supplier networks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 h-9 cursor-pointer rounded-xl transition-all active:scale-[0.98]"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4" /> Add Ingredient
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI: Total */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-white/5 text-fg-muted">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Total Ingredients</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-0.5">{totalIngredients}</span>}
          </div>
        </div>

        {/* KPI: Active */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-success/10 text-success">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Active</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-success mt-0.5">{activeCount}</span>}
          </div>
        </div>

        {/* KPI: Archived */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-white/5 text-fg-muted">
            <Archive className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Archived</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg-muted mt-0.5">{archivedCount}</span>}
          </div>
        </div>

        {/* KPI: Categories */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Categories</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-0.5">{categoriesCount}</span>}
          </div>
        </div>

        {/* KPI: Suppliers */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01] col-span-2 lg:col-span-1">
          <div className="p-2.5 rounded-xl bg-white/5 text-fg-muted">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Suppliers</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-0.5">{suppliersCount}</span>}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search ingredients by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-[#141416] border border-white/10 rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[130px]"
          >
            <option value="all">All Categories</option>
            {categories.map((c: InventoryCategory) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Supplier Filter */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[130px]"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((s: Supplier) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[110px]"
          >
            <option value="all">All Units</option>
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[110px]"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-xs px-3 hover:bg-white/5 text-fg-subtle hover:text-fg cursor-pointer rounded-xl"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setSupplierFilter("all");
                setUnitFilter("all");
                setStatusFilter("all");
              }}
            >
              <X className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {itemsError && (
        <div className="p-4 rounded-xl bg-danger/10 text-danger border border-danger/20 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load ingredient records. Please verify database connection.</span>
        </div>
      )}

      {/* Ingredients Catalog Table */}
      <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
          </div>
        ) : stock.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
            <Package className="w-10 h-10 text-fg-subtle opacity-50 mb-1" />
            <p className="text-sm font-medium text-fg">Your ingredient master is empty.</p>
            <p className="text-xs text-fg-subtle font-normal">Establish your inventory records by adding your first ingredient.</p>
            <Button size="sm" className="mt-2.5 gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground cursor-pointer rounded-xl h-9 px-4 font-semibold" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add Ingredient
            </Button>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-center">
            <p className="text-sm font-semibold text-fg">No ingredients match your current search.</p>
            <p className="text-xs text-fg-subtle">Try adjusting your filters or resetting search parameters.</p>
            <Button size="sm" variant="secondary" className="mt-2.5 cursor-pointer rounded-xl" onClick={() => { setSearch(""); setCategoryFilter("all"); setSupplierFilter("all"); setUnitFilter("all"); setStatusFilter("all"); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ingredient</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Category</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Unit</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Supplier</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Cost per Unit</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Current Stock</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Reorder Level</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-fg">{item.name}</span>
                        {item.sku && (
                          <span className="text-[10px] font-mono text-fg-subtle mt-0.5 tracking-tight flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-fg-muted" /> SKU: {item.sku}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted">
                      {item.categoryName}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted">
                      {item.unit}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted">
                      {item.supplierName}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted font-mono">
                      $0.00
                    </TableCell>
                    <TableCell className="py-3 text-sm font-bold text-fg font-mono">
                      {item.currentStock} {item.unit}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted font-mono">
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell className="py-3">
                      {item.status === "ACTIVE" ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/15 border-none text-[10px] font-bold py-0.5 px-2 rounded-full">Active</Badge>
                      ) : (
                        <Badge className="bg-white/5 text-fg-muted hover:bg-white/10 border-none text-[10px] font-bold py-0.5 px-2 rounded-full">Archived</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                          title="Edit Ingredient Details"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/10 transition-colors cursor-pointer"
                          title="Delete Ingredient"
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

      {/* Detail / Form Drawer Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              {editItem ? "Edit Ingredient details" : "Create Ingredient record"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6 p-6">
            
            {/* Section A: Basic Information */}
            <div className="space-y-4.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Info className="w-3.5 h-3.5" /> Basic Information
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Ingredient Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tomatoes, Cheddar Cheese"
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl focus:border-white/20"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Catalog Category *</Label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors"
                  required
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c: InventoryCategory) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">SKU (Internal Code)</Label>
                  <Input
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="ING-TOM-001"
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Barcode (Scan Value)</Label>
                  <Input
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="0123456789"
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Description</Label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Additional catalog specifications, grade details..."
                  className="w-full min-h-[70px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Status</Label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors"
                >
                  <option value="ACTIVE">Active (Available for recipes)</option>
                  <option value="ARCHIVED">Archived (Temporarily out-of-use)</option>
                </select>
              </div>
            </div>

            {/* Section B: Inventory Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Layers3 className="w-3.5 h-3.5" /> Inventory Details
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Unit of Measure *</Label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                    required
                  >
                    <option value="kg">kilograms (kg)</option>
                    <option value="liters">liters (L)</option>
                    <option value="units">units (pcs)</option>
                    <option value="grams">grams (g)</option>
                    <option value="oz">ounces (oz)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Reorder Alert Level *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Current Quantity ({formUnit})</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                />
                <span className="text-[10px] text-fg-muted block italic mt-1">
                  * Current stock is temporarily mutable until Stock Movement engine is introduced.
                </span>
              </div>
            </div>

            {/* Section C: Cost & Storage Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Building2 className="w-3.5 h-3.5" /> Cost & Supplier
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Supplier *</Label>
                <select
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                  required
                >
                  <option value="" disabled>Select supplier</option>
                  {suppliers.map((s: Supplier) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Storage Location</Label>
                <Input
                  value={formStorageLocation}
                  onChange={(e) => setFormStorageLocation(e.target.value)}
                  placeholder="e.g. Walk-in Cooler, Dry Shelf B"
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                />
                <span className="text-[9px] text-fg-muted block mt-1">
                  Storage location will be bound to central storage directories in future versions.
                </span>
              </div>
            </div>

            {/* Section D: System Information (Auditor Details) */}
            {editItem && (
              <div className="space-y-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl text-[11px] text-fg-subtle">
                <div className="font-bold text-[10px] uppercase tracking-wider text-accent-foreground mb-1.5 flex items-center gap-1.5">
                  System Audit Info
                </div>
                {editItem.createdById && (
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted flex items-center gap-1"><User className="w-3 h-3" /> Created By ID:</span>
                    <span className="font-mono">{editItem.createdById}</span>
                  </div>
                )}
                {editItem.updatedById && (
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted flex items-center gap-1"><User className="w-3 h-3" /> Last Updated By:</span>
                    <span className="font-mono">{editItem.updatedById}</span>
                  </div>
                )}
                {editItem.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted flex items-center gap-1"><Calendar className="w-3 h-3" /> Created:</span>
                    <span>{new Date(editItem.createdAt).toLocaleString()}</span>
                  </div>
                )}
                {editItem.updatedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted flex items-center gap-1"><Calendar className="w-3 h-3" /> Modified:</span>
                    <span>{new Date(editItem.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4 cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4 cursor-pointer" disabled={createMutation.isPending || updateMutation.isPending}>
                {editItem ? "Save changes" : "Add ingredient"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
