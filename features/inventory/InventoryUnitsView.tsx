"use client";

import React, { useState, useMemo } from "react";
import {
  useInventoryUnits,
  useCreateInventoryUnit,
  useUpdateInventoryUnit,
  useDeleteInventoryUnit,
  InventoryUnit,
} from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Scale,
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
  Layers,
  Sparkles
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

export function InventoryUnitsView() {
  const { data: units = [], isLoading, error } = useInventoryUnits();

  const createMutation = useCreateInventoryUnit();
  const updateMutation = useUpdateInventoryUnit();
  const deleteMutation = useDeleteInventoryUnit();

  // Toolbar state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("symbolAsc");

  // Drawer state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [editItem, setEditItem] = useState<InventoryUnit | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSymbol, setFormSymbol] = useState("");
  const [formBaseUnit, setFormBaseUnit] = useState("");
  const [formConversionFactor, setFormConversionFactor] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Open create drawer
  const handleOpenCreate = () => {
    setEditItem(null);
    setIsReadOnly(false);
    setFormName("");
    setFormSymbol("");
    setFormBaseUnit("");
    setFormConversionFactor("");
    setFormIsActive(true);
    setSheetOpen(true);
  };

  // Open edit / view drawer
  const handleOpenEdit = (item: InventoryUnit, readOnly = false) => {
    setEditItem(item);
    setIsReadOnly(readOnly);
    setFormName(item.name);
    setFormSymbol(item.symbol);
    setFormBaseUnit(item.baseUnit || "");
    setFormConversionFactor(item.conversionFactor ? item.conversionFactor.toString() : "");
    setFormIsActive(item.isActive);
    setSheetOpen(true);
  };

  // Submit Drawer Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formName.trim() || !formSymbol.trim()) {
      toast.error("Unit name and symbol are required.");
      return;
    }

    const payload = {
      name: formName,
      symbol: formSymbol,
      baseUnit: formBaseUnit || null,
      conversionFactor: parseFloat(formConversionFactor) || null,
      isActive: formIsActive
    };

    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          ...payload
        });
        toast.success("Unit updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Unit created successfully");
      }
      setSheetOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Operation failed");
    }
  };

  // Delete Unit
  const handleDelete = async (item: InventoryUnit) => {
    // Prevent deleting unit currently bound to ingredients
    if ((item.ingredientCount || 0) > 0) {
      toast.error(
        `Cannot delete unit symbol "${item.symbol}" because it is currently assigned to ${item.ingredientCount} ingredient(s). Please reassign them first or archive the unit.`,
        { duration: 6000 }
      );
      return;
    }

    if (confirm(`Are you sure you want to delete unit "${item.name}" (${item.symbol})?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
        toast.success("Unit deleted successfully");
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete unit");
      }
    }
  };

  // Archive / Restore Unit
  const handleToggleArchive = async (item: InventoryUnit) => {
    const actionWord = item.isActive ? "archive" : "restore";
    if (confirm(`Are you sure you want to ${actionWord} the unit "${item.symbol}"?`)) {
      try {
        await updateMutation.mutateAsync({
          id: item.id,
          isActive: !item.isActive
        });
        toast.success(`Unit ${actionWord}d successfully`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to update unit status");
      }
    }
  };

  // Filtering & Sorting
  const filteredUnits = useMemo(() => {
    return units
      .filter((u: InventoryUnit) => {
        const term = search.toLowerCase();
        const matchesSearch = u.name.toLowerCase().includes(term) || u.symbol.toLowerCase().includes(term);

        let matchesStatus = true;
        if (statusFilter === "ACTIVE") matchesStatus = u.isActive;
        if (statusFilter === "ARCHIVED") matchesStatus = !u.isActive;

        return matchesSearch && matchesStatus;
      })
      .sort((a: InventoryUnit, b: InventoryUnit) => {
        if (sortBy === "symbolAsc") return a.symbol.localeCompare(b.symbol);
        if (sortBy === "symbolDesc") return b.symbol.localeCompare(a.symbol);
        if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
        if (sortBy === "mostUsed") return (b.ingredientCount || 0) - (a.ingredientCount || 0);
        if (sortBy === "leastUsed") return (a.ingredientCount || 0) - (b.ingredientCount || 0);
        return 0;
      });
  }, [units, search, statusFilter, sortBy]);

  // Derived KPI Counts
  const totalUnits = units.length;
  const activeUnitsCount = units.filter((u: InventoryUnit) => u.isActive).length;
  const totalAssignedIngredients = units.reduce((sum: number, u: InventoryUnit) => sum + (u.ingredientCount || 0), 0);

  const hasActiveFilters = !!(search || statusFilter !== "all" || sortBy !== "symbolAsc");

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Catalog Units</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Units of Measure</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Configure default and custom units of measure, metric scaling factors, and conversions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 h-9 cursor-pointer rounded-xl transition-all active:scale-[0.98]"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4" /> Add Unit
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI: Total */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-white/5 text-fg-muted">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Total Units</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-0.5">{totalUnits}</span>}
          </div>
        </div>

        {/* KPI: Active */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-success/10 text-success">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Active Units</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-success mt-0.5">{activeUnitsCount}</span>}
          </div>
        </div>

        {/* KPI: Ingredients Using Units */}
        <div className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01]">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Layers3 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Ingredients Using Units</span>
            {isLoading ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-0.5">{totalAssignedIngredients}</span>}
          </div>
        </div>
      </div>

      {/* Toolbar Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search units by name or symbol (e.g. kg, grams)..."
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

          {/* Sort Selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[130px]"
          >
            <option value="symbolAsc">Symbol (A-Z)</option>
            <option value="symbolDesc">Symbol (Z-A)</option>
            <option value="nameAsc">Name (A-Z)</option>
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
                setSortBy("symbolAsc");
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
          <span>Failed to load unit catalog. Please verify backend database state.</span>
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
        ) : units.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
            <Scale className="w-10 h-10 text-fg-subtle opacity-50 mb-1" />
            <p className="text-sm font-medium text-fg">No measurement units found.</p>
            <p className="text-xs text-fg-subtle font-normal">Establish unit categories by creating your first measurement unit.</p>
            <Button size="sm" className="mt-2.5 gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground cursor-pointer rounded-xl h-9 px-4 font-semibold" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Add Unit
            </Button>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-center">
            <p className="text-sm font-semibold text-fg">No units match your filter criteria.</p>
            <p className="text-xs text-fg-subtle">Try modifying your search or resetting active filters.</p>
            <Button size="sm" variant="secondary" className="mt-2.5 cursor-pointer rounded-xl" onClick={() => { setSearch(""); setStatusFilter("all"); setSortBy("symbolAsc"); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Unit Name</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Symbol</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Base Unit</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Conversion Factor</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ingredients Using</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((item: InventoryUnit) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                    <TableCell className="py-3 font-semibold text-fg text-sm">
                      {item.name}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className="bg-white/5 border border-white/15 text-fg font-mono text-[10px] font-bold py-0.5 px-2.5 rounded-lg">
                        {item.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted">
                      {item.baseUnit ? (
                        <span className="font-mono bg-accent/5 text-accent border border-accent/15 px-2 py-0.5 rounded-lg">{item.baseUnit}</span>
                      ) : (
                        <span className="italic text-fg-subtle opacity-60">Primary / Base Unit</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-fg-muted font-mono">
                      {item.conversionFactor !== null ? `× ${item.conversionFactor}` : "-"}
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
                          title="Edit Unit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(item)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors cursor-pointer"
                          title={item.isActive ? "Archive Unit" : "Restore Unit"}
                        >
                          {item.isActive ? <Archive className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/10 transition-colors cursor-pointer"
                          title="Delete Unit"
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

      {/* Sheet Unit Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-l-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent" />
              {isReadOnly ? "View Unit Details" : editItem ? "Edit Unit Details" : "Create Measurement Unit"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6 p-6">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Info className="w-3.5 h-3.5" /> Basic Information
              </div>

              {/* Unit Name */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Unit Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Kilogram, Litre, Piece"
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl focus:border-white/20"
                  disabled={isReadOnly}
                  required
                />
              </div>

              {/* Symbol */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Symbol (Unique code) *</Label>
                <Input
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  placeholder="e.g. kg, L, pcs, g, ml"
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl focus:border-white/20 font-mono"
                  disabled={isReadOnly}
                  required
                />
              </div>
            </div>

            {/* Section 2: Metric Scaling & Conversion */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Sparkles className="w-3.5 h-3.5" /> Metric Conversion Setup
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Base Unit */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Base Unit Relation</Label>
                  <select
                    value={formBaseUnit}
                    onChange={(e) => setFormBaseUnit(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                    disabled={isReadOnly}
                  >
                    <option value="">None (Primary Unit)</option>
                    {units
                      .filter((u: InventoryUnit) => u.id !== editItem?.id && !u.baseUnit) // limit relations to base units only to avoid nesting loops
                      .map((u: InventoryUnit) => (
                        <option key={u.id} value={u.symbol}>{u.name} ({u.symbol})</option>
                      ))}
                  </select>
                </div>

                {/* Conversion Factor */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Multiplier Factor</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formConversionFactor}
                    onChange={(e) => setFormConversionFactor(e.target.value)}
                    placeholder="e.g. 0.001"
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                    disabled={isReadOnly || !formBaseUnit}
                  />
                </div>
              </div>
              {formBaseUnit && (
                <span className="text-[9.5px] text-fg-muted block leading-relaxed italic">
                  * Dynamic formula: 1 {formSymbol || "unit"} = {formConversionFactor || "0"} {formBaseUnit}.
                </span>
              )}
            </div>

            {/* Section 3: Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <Settings className="w-3.5 h-3.5" /> Unit Settings
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Status</Label>
                <select
                  value={formIsActive ? "active" : "archived"}
                  onChange={(e) => setFormIsActive(e.target.value === "active")}
                  className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors"
                  disabled={isReadOnly}
                >
                  <option value="active">Active (Available for catalog mapping)</option>
                  <option value="archived">Archived (Temporarily unavailable)</option>
                </select>
              </div>
            </div>

            {/* Section 4: Read-Only Statistics */}
            {editItem && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                  <Layers className="w-3.5 h-3.5" /> Statistics & Audit
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
                  {editItem ? "Save Changes" : "Create Unit"}
                </Button>
              )}
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
