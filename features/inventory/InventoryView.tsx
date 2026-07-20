"use client";

import React, { useState, useMemo } from "react";
import {
  useWastePercentage,
  useStockoutIncidents,
  useCostTrends,
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  InventoryItem,
} from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PackageOpen,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Plus,
  Search,
  X,
  Pencil,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function InventoryView() {
  // Backend Queries & Mutations
  const { data: stock = [], isLoading: isLoadingItems } = useInventoryItems();
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  const waste = useWastePercentage();
  const stockouts = useStockoutIncidents();
  const costs = useCostTrends();

  const isLoadingAnalytics = waste.isLoading || stockouts.isLoading || costs.isLoading;

  // Local UI state (search, filters, expanded categories, dialogs, form inputs)
  const [activeTab, setActiveTab] = useState("levels");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nameAsc");

  // Collapse Category States
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("steward-collapsed-inventory-categories");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => {
      const updated = { ...prev, [catName]: !prev[catName] };
      try {
        localStorage.setItem("steward-collapsed-inventory-categories", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Create / Edit Sheets State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  // Quick Adjustment Dialog State
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustVal, setAdjustVal] = useState("");

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Vegetables");
  const [formStock, setFormStock] = useState("");
  const [formMinStock, setFormMinStock] = useState("5");
  const [formUnit, setFormUnit] = useState("kg");
  const [formSupplier, setFormSupplier] = useState("Fresh Farms");

  // Dynamic category and supplier lists from backend stock data
  const categories = useMemo(() => {
    return Array.from(new Set(stock.map((i) => i.category)));
  }, [stock]);

  const suppliers = useMemo(() => {
    return Array.from(new Set(stock.map((i) => i.supplier)));
  }, [stock]);

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormName("");
    setFormCategory("Vegetables");
    setFormStock("0");
    setFormMinStock("5");
    setFormUnit("kg");
    setFormSupplier("Fresh Farms");
    setSheetOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormStock(item.currentStock.toString());
    setFormMinStock(item.minStock.toString());
    setFormUnit(item.unit);
    setFormSupplier(item.supplier);
    setSheetOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory.trim() || !formSupplier.trim()) return;

    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          name: formName,
          category: formCategory,
          currentStock: parseFloat(formStock) || 0,
          minStock: parseFloat(formMinStock) || 0,
          unit: formUnit,
          supplier: formSupplier,
        });
        toast.success("Ingredient updated");
      } else {
        await createMutation.mutateAsync({
          name: formName,
          category: formCategory,
          currentStock: parseFloat(formStock) || 0,
          minStock: parseFloat(formMinStock) || 0,
          unit: formUnit,
          supplier: formSupplier,
        });
        toast.success("Ingredient added");
      }
      setSheetOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    }
  };

  const handleStockUpdate = async (itemId: string, newStock: number) => {
    try {
      await updateMutation.mutateAsync({
        id: itemId,
        currentStock: newStock,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update stock");
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteMutation.mutateAsync(itemId);
      toast.success("Ingredient deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete ingredient");
    }
  };

  // Filter & Sort inventory list
  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const term = search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(term) || item.supplier.toLowerCase().includes(term);

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSupplier = supplierFilter === "all" || item.supplier === supplierFilter;

      let matchesStatus = true;
      if (statusFilter === "healthy") {
        matchesStatus = item.currentStock > item.minStock;
      } else if (statusFilter === "low") {
        matchesStatus = item.currentStock > 0 && item.currentStock <= item.minStock;
      } else if (statusFilter === "out") {
        matchesStatus = item.currentStock === 0;
      }

      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
    });
  }, [stock, search, categoryFilter, supplierFilter, statusFilter]);

  const sortedStock = useMemo(() => {
    return [...filteredStock].sort((a, b) => {
      if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
      if (sortBy === "stockAsc") return a.currentStock - b.currentStock;
      if (sortBy === "stockDesc") return b.currentStock - a.currentStock;
      return a.name.localeCompare(b.name);
    });
  }, [filteredStock, sortBy]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups = categories.map((cat) => {
      const catItems = sortedStock.filter((item) => item.category === cat);
      return {
        category: cat,
        items: catItems,
      };
    });
    const uncategorizedItems = sortedStock.filter(
      (item) => !categories.includes(item.category)
    );
    if (uncategorizedItems.length > 0) {
      groups.push({
        category: "Uncategorized",
        items: uncategorizedItems,
      });
    }
    return groups;
  }, [categories, sortedStock]);

  // Derived Operational Metrics (calculated strictly from backend stock data)
  const healthyCount = stock.filter((i) => i.currentStock > i.minStock).length;
  const lowCount = stock.filter((i) => i.currentStock > 0 && i.currentStock <= i.minStock).length;
  const outCount = stock.filter((i) => i.currentStock === 0).length;

  const inventoryHealth = stock.length === 0 ? "Empty" : outCount > 0 ? "Critical" : lowCount > 0 ? "Attention Needed" : "Healthy";
  const healthReason =
    stock.length === 0
      ? "No inventory items recorded."
      : inventoryHealth === "Critical"
      ? `${outCount} item(s) out of stock.`
      : inventoryHealth === "Attention Needed"
      ? `${lowCount} item(s) running low.`
      : "All stock levels healthy.";

  // Filter items that need replenishment
  const replenishmentItems = useMemo(() => {
    const lowOrOut = stock.filter((i) => i.currentStock <= i.minStock);
    return lowOrOut.sort((a, b) => {
      const aOut = a.currentStock === 0 ? 0 : 1;
      const bOut = b.currentStock === 0 ? 0 : 1;
      if (aOut !== bOut) return aOut - bOut;
      return a.name.localeCompare(b.name);
    });
  }, [stock]);

  const hasActiveFilters = !!(
    search ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    supplierFilter !== "all" ||
    sortBy !== "nameAsc"
  );

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto text-fg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1.5 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs mb-1">Catalog Management</div>
          <h2 className="text-xl font-bold tracking-tight text-fg">Inventory Control</h2>
          <p className="text-[12px] text-fg-subtle mt-0.5">
            Monitor stock health, log replenishment values, and track volatility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "levels" && (
            <Button
              size="sm"
              className="gap-1.5 bg-accent hover:bg-accent/90 text-white cursor-pointer"
              onClick={handleOpenCreate}
            >
              <Plus className="h-3.5 w-3.5" /> Add Ingredient
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="levels" onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-white/5 p-1 rounded-xl mb-5 border border-white/5">
          {[
            { value: "levels", label: "Stock Levels" },
            { value: "health", label: "Health & Spoilage" },
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

        {/* Tab content 1: Stock Levels */}
        <TabsContent value="levels" className="space-y-5">
          
          {/* Overview summary Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Healthy Items</span>
              {isLoadingItems ? <Skeleton className="h-7 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-black text-success num mt-1">{healthyCount}</span>}
            </div>
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Low Stock</span>
              {isLoadingItems ? <Skeleton className="h-7 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-black text-warning num mt-1">{lowCount}</span>}
            </div>
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Out of Stock</span>
              {isLoadingItems ? <Skeleton className="h-7 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-black text-danger num mt-1">{outCount}</span>}
            </div>
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Categories</span>
              {isLoadingItems ? <Skeleton className="h-7 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-black text-fg num mt-1">{categories.length}</span>}
            </div>
            <div className={cn("col-span-2 lg:col-span-1 flex flex-col p-4 rounded-2xl border justify-center", inventoryHealth === "Empty" ? "border-white/10 bg-white/5 text-fg-muted" : inventoryHealth === "Healthy" ? "border-success/20 bg-success/5 text-success" : inventoryHealth === "Attention Needed" ? "border-warning/20 bg-warning/5 text-warning" : "border-danger/20 bg-danger/5 text-danger")}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 select-none">Inventory Health</span>
                {inventoryHealth === "Healthy" || inventoryHealth === "Empty" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              </div>
              {isLoadingItems ? (
                <Skeleton className="h-6 w-24 bg-white/5 mt-1" />
              ) : (
                <>
                  <span className="text-[15.5px] font-black tracking-tight mt-1">{inventoryHealth.toUpperCase()}</span>
                  <span className="text-[10px] opacity-75 mt-0.5 font-normal truncate">{healthReason}</span>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Needs Replenishment */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-fg-subtle select-none">Needs Replenishment</h3>
            {isLoadingItems ? (
              <Skeleton className="h-14 w-full bg-white/5 rounded-xl" />
            ) : replenishmentItems.length === 0 ? (
              <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
                <CheckCircle className="h-4.5 w-4.5 text-success shrink-0" />
                <span className="text-[12.5px] font-semibold text-success">✓ Stock levels are fully replenished. You are ready for today's service.</span>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {replenishmentItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3.5 rounded-xl border text-[12.5px] flex items-center justify-between font-medium",
                      item.currentStock === 0 ? "bg-danger/10 border-danger/20 text-danger" : "bg-warning/10 border-warning/20 text-warning"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px]">{item.name}</span>
                        <span className="text-[10.5px] opacity-80 mt-0.5">{item.category} • Supplier: {item.supplier}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-extrabold num text-sm">{item.currentStock} {item.unit}</span>
                        <span className="text-[10px] opacity-75 block">Limit: {item.minStock} {item.unit}</span>
                      </div>
                      <button
                        onClick={() => setAdjustItem(item)}
                        className="h-8 px-3 rounded-lg border border-current text-[11.5px] font-bold hover:bg-white/5 active:scale-[0.97] transition-all cursor-pointer shrink-0"
                      >
                        Adjust Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search & Filters Toolbar */}
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-3 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search ingredients by name or supplier..."
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
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="healthy">Healthy Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>

              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
              >
                <option value="nameAsc">Name (A-Z)</option>
                <option value="nameDesc">Name (Z-A)</option>
                <option value="stockAsc">Stock: Low to High</option>
                <option value="stockDesc">Stock: High to Low</option>
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-[11px] px-2.5 hover:bg-white/5 text-fg-subtle hover:text-fg cursor-pointer"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSupplierFilter("all");
                    setSortBy("nameAsc");
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Catalog Listing */}
          <div className="card-premium overflow-hidden border border-white/5 rounded-2xl bg-white/[0.01]">
            {isLoadingItems ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ) : stock.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <PackageOpen className="w-10 h-10 text-fg-subtle opacity-50 mb-1" />
                <p className="text-[13px] font-medium text-fg">Your inventory is empty.</p>
                <p className="text-[11px] text-fg-subtle font-normal">Start by adding your first inventory item.</p>
                <Button size="sm" className="mt-2 gap-1.5 bg-accent hover:bg-accent/90 text-white cursor-pointer" onClick={handleOpenCreate}>
                  <Plus className="h-3.5 w-3.5" /> Add Ingredient
                </Button>
              </div>
            ) : sortedStock.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-[13px] font-bold text-fg">No inventory items match your current search.</p>
                <p className="text-[11px] text-fg-subtle">Try adjusting your search or clearing filters.</p>
                <Button size="sm" variant="secondary" className="mt-2 cursor-pointer" onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); setSupplierFilter("all"); setSortBy("nameAsc"); }}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                      <TableHead className="h-9 w-14 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Stock Health</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Item Name</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Current Qty</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Reorder level</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Category</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Supplier / Details</TableHead>
                      <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsByCategory.map((group) => {
                      const isCollapsed = !!collapsedCategories[group.category];
                      return (
                        <React.Fragment key={group.category}>
                          {/* Category Header Row */}
                          <TableRow
                            className="bg-white/[0.02] border-y border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors"
                            onClick={() => toggleCategory(group.category)}
                          >
                            <TableCell colSpan={7} className="py-2.5 px-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isCollapsed ? (
                                    <ChevronRight className="h-4 w-4 text-fg-subtle" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-fg-subtle" />
                                  )}
                                  <span className="font-bold text-fg text-[13px]">{group.category}</span>
                                </div>
                                <span className="text-[10px] text-fg-muted font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                  {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Items Loop */}
                          {!isCollapsed && (
                            group.items.length === 0 ? (
                              <TableRow className="border-white/5 hover:bg-transparent">
                                <TableCell colSpan={7} className="py-4 text-center text-xs text-fg-subtle italic">
                                  No inventory items in this category yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              group.items.map((item) => {
                                const isLow = item.currentStock > 0 && item.currentStock <= item.minStock;
                                const isOut = item.currentStock === 0;

                                return (
                                  <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                                    <TableCell className="py-2.5">
                                      {isOut ? (
                                        <Badge variant="danger" className="text-[9px] font-bold">OUT</Badge>
                                      ) : isLow ? (
                                        <Badge variant="warning" className="text-[9px] font-bold">LOW</Badge>
                                      ) : (
                                        <Badge variant="success" className="text-[9px] font-bold">OK</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-2.5">
                                      <div className="flex flex-col">
                                        <span className="text-[13px] font-semibold text-fg">{item.name}</span>
                                        <span className="text-[10px] text-fg-subtle mt-0.5">Updated: {item.lastUpdated}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2.5 text-[13px] font-bold text-fg num">
                                      {item.currentStock} {item.unit}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-[12px] text-fg-muted num">
                                      {item.minStock} {item.unit}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-[12px] text-fg-muted">
                                      {item.category}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-[12px] text-fg-muted font-normal">
                                      {item.supplier}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => setAdjustItem(item)}
                                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                                          title="Adjust Stock"
                                        >
                                          <ArrowUpDown className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleOpenEdit(item)}
                                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                                          title="Edit Ingredient"
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
                                              onClick={() => handleDelete(item.id)}
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
                                );
                              })
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
        </TabsContent>

        {/* Tab content 2: Health & Spoilage */}
        <TabsContent value="health">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Waste Percentage */}
            <div className="card-premium p-4 space-y-4 border border-white/5 rounded-xl bg-white/[0.01]">
              <div className="flex items-center gap-2 text-fg-subtle border-b border-white/5 pb-2">
                <Trash2 className="h-4 w-4" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider">Waste & Spoilage</h3>
              </div>
              {isLoadingAnalytics ? (
                <Skeleton className="h-[200px] w-full bg-[#1a1a1c] rounded-lg" />
              ) : (
                <div className="space-y-3">
                  {waste.data?.map((item: any) => (
                    <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/5 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium text-fg">{item.name}</span>
                        <span className={cn("text-[13px] font-bold num", item.wastePercent > 10 ? "text-danger" : "text-fg")}>
                          {item.wastePercent}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-fg-subtle">
                        <span>Usage: {item.theoreticalUsage} {item.unit}</span>
                        <span>Wasted: {item.wastedQuantity} {item.unit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1 relative">
                        <div className={cn("h-full absolute left-0 top-0", item.wastePercent > 10 ? "bg-danger" : "bg-warning")} style={{ width: `${Math.min(100, item.wastePercent)}%` }} />
                      </div>
                    </div>
                  ))}
                  {(!waste.data || waste.data.length === 0) && <p className="text-sm text-fg-muted italic">No waste data.</p>}
                </div>
              )}
            </div>

            {/* Cost Volatility */}
            <div className="card-premium p-4 space-y-4 border border-white/5 rounded-xl bg-white/[0.01]">
              <div className="flex items-center gap-2 text-fg-subtle border-b border-white/5 pb-2">
                <TrendingUp className="h-4 w-4" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider">Price Volatility</h3>
              </div>
              {isLoadingAnalytics ? (
                <Skeleton className="h-[200px] w-full bg-[#1a1a1c] rounded-lg" />
              ) : (
                <div className="space-y-3">
                  {costs.data?.map((item: any) => (
                    <div key={item.ingredientId} className={cn("flex flex-col gap-2 rounded-lg border p-3", item.isVolatile ? "border-danger/30 bg-danger/5" : "border-white/5 bg-white/5")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.isVolatile && <AlertTriangle className="h-3 w-3 text-danger" />}
                          <span className="text-[13px] font-medium text-fg">{item.name}</span>
                        </div>
                        <Badge variant={item.isVolatile ? "danger" : "neutral"} className="text-[10px] font-semibold px-2 py-0.5">
                          {item.maxSpikePercent > 0 ? "+" : ""}{item.maxSpikePercent}% spike
                        </Badge>
                      </div>
                      {item.changes.length > 0 && (
                        <div className="text-[11px] text-fg-subtle flex justify-between">
                          <span>Latest:</span>
                          <span className="num">
                            ${item.changes[item.changes.length - 1].oldCost} → ${item.changes[item.changes.length - 1].newCost}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!costs.data || costs.data.length === 0) && <p className="text-sm text-fg-muted italic">No cost changes tracked.</p>}
                </div>
              )}
            </div>

            {/* Stockouts */}
            <div className="card-premium p-4 space-y-4 border border-white/5 rounded-xl bg-white/[0.01]">
              <div className="flex items-center gap-2 text-fg-subtle border-b border-white/5 pb-2">
                <PackageOpen className="h-4 w-4" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider">Stockout Incidents</h3>
              </div>
              {isLoadingAnalytics ? (
                <Skeleton className="h-[200px] w-full bg-[#1a1a1c] rounded-lg" />
              ) : (
                <div className="space-y-3">
                  {stockouts.data?.map((incident: any) => (
                    <div key={incident.id} className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-fg">{incident.name}</span>
                        <span className="text-[10px] text-fg-subtle num">
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-fg-subtle mt-1">
                        {incident.resolvedAt ? (
                          <span className="text-success">Resolved in {incident.durationMins}m</span>
                        ) : (
                          <span className="text-danger flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Currently Stocked Out</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!stockouts.data || stockouts.data.length === 0) && <p className="text-sm text-fg-muted italic">No recent stockouts.</p>}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-fg font-semibold">{editItem ? "Edit Ingredient" : "Add Ingredient"}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="space-y-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                Details & Group
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Ingredient Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tomatoes, Cheddar Cheese"
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Category *</Label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Grains & Baking">Grains & Baking</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Spices & Pastes">Spices & Pastes</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Unit of Measure *</Label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="kg">kilograms (kg)</option>
                    <option value="liters">liters (L)</option>
                    <option value="units">units (pcs)</option>
                    <option value="grams">grams (g)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                Stock Levels & Supplier
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Current Stock</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Minimum Warning level</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Supplier *</Label>
                <select
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg outline-none focus:border-white/20 transition-colors"
                >
                  <option value="Fresh Farms">Fresh Farms</option>
                  <option value="Apex Poultry">Apex Poultry</option>
                  <option value="Dairy Land">Dairy Land</option>
                  <option value="Global Grains">Global Grains</option>
                  <option value="Ocean Catch">Ocean Catch</option>
                  <option value="Spices Inc.">Spices Inc.</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="border-white/10 hover:bg-white/5 text-fg animate-scale-in cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-white cursor-pointer" disabled={createMutation.isPending || updateMutation.isPending}>
                {editItem ? "Save changes" : "Add ingredient"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Quick Adjustment dialog */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[360px] rounded-xl border border-white/5 bg-[#0F0F10] p-5 shadow-2xl text-fg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-[13.5px] font-semibold text-fg">Adjust Stock: {adjustItem.name}</h3>
              <button onClick={() => setAdjustItem(null)} className="text-fg-subtle hover:text-fg transition-colors">
                <X className="h-4 w-4 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-[12px] text-fg-subtle">
                <span>Current Stock:</span>
                <span className="font-bold text-fg num">{adjustItem.currentStock} {adjustItem.unit}</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider block">Quick Adjustments</span>
                <div className="flex gap-2">
                  {[-5, -1, 1, 5].map((val) => (
                    <Button
                      key={val}
                      variant="secondary"
                      size="sm"
                      className="flex-1 h-8 text-[12px] bg-white/5 hover:bg-white/10 border-white/10 text-fg cursor-pointer"
                      onClick={() => {
                        const newStock = Math.max(0, adjustItem.currentStock + val);
                        handleStockUpdate(adjustItem.id, newStock);
                        setAdjustItem((prev: any) => prev ? { ...prev, currentStock: newStock } : null);
                      }}
                    >
                      {val > 0 ? `+${val}` : val}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Set Stock Quantity ({adjustItem.unit})</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={adjustVal}
                    onChange={(e) => setAdjustVal(e.target.value)}
                    placeholder="Enter quantity"
                    className="bg-[#1a1a1c] border-white/10 h-9 text-[12px]"
                  />
                  <Button
                    onClick={() => {
                      const val = parseFloat(adjustVal);
                      if (!isNaN(val) && val >= 0) {
                        handleStockUpdate(adjustItem.id, val);
                        setAdjustItem((prev: any) => prev ? { ...prev, currentStock: val } : null);
                        setAdjustVal("");
                      }
                    }}
                    className="bg-accent hover:bg-accent/90 text-white h-9 text-[12px] px-3 cursor-pointer"
                  >
                    Set
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
                <Button variant="outline" size="sm" onClick={() => setAdjustItem(null)} className="h-8 text-[11px] border-white/10 hover:bg-white/5 text-fg cursor-pointer">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
