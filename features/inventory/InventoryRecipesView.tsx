"use client";

import React, { useState, useMemo } from "react";
import {
  useRecipeDashboard,
  useRecipes,
  useRecipeBreakdown,
  useValidateRecipes,
  useSaveRecipe,
  RecipeItem,
  RecipeBreakdown,
  ValidationError,
} from "@/hooks/useRecipeManagement";
import {
  useInventoryItems,
  useInventoryUnits,
  InventoryItem,
  InventoryUnit,
} from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Scale,
  Calendar,
  Clock,
  Layers,
  Info,
  DollarSign,
  PlusCircle,
  Trash2,
  FileText,
  AlertTriangle,
  History,
  FileCheck,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Award,
  Sparkles,
  BookOpen
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "@/lib/axios";

export function InventoryRecipesView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Backend queries
  const { data: dashboard, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useRecipeDashboard();
  const { data: rawIngredients = [], isLoading: isLoadingIng } = useInventoryItems();
  const { data: unitTypes = [] } = useInventoryUnits();
  const { data: validations = [], isLoading: isLoadingVal, refetch: refetchVal } = useValidateRecipes();

  // Recipe list filters
  const [listSearch, setListSearch] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState("all");

  const { data: recipes = [], isLoading: isLoadingRecipes, refetch: refetchRecipes } = useRecipes({
    search: listSearch,
    status: listStatusFilter === "all" ? undefined : listStatusFilter
  });

  const saveRecipeMutation = useSaveRecipe();

  // Menu items list (for linking finished items)
  const [menuItemsList, setMenuItemsList] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Load menu items list on mount
  React.useEffect(() => {
    async function loadMenuItems() {
      setIsLoadingMenu(true);
      try {
        const { data } = await axios.get("/admin/menu/items");
        // Flatten list if inside categories
        const list = data.data || [];
        setMenuItemsList(list.map((m: any) => ({
          id: m.id,
          name: m.name,
          price: m.price ? parseFloat(m.price) : 0
        })));
      } catch (err) {
        console.error("Failed to load menu items", err);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    loadMenuItems();
  }, []);

  // UI state variables
  const [builderOpen, setBuilderOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);

  const { data: activeBreakdown, isLoading: isLoadingBreakdown } = useRecipeBreakdown(activeRecipeId);

  // Builder states
  const [linkType, setLinkType] = useState<"menu" | "prep">("menu");
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [selectedPrepIngredient, setSelectedPrepIngredient] = useState("");
  const [builderStatus, setBuilderStatus] = useState("PUBLISHED");
  const [yieldPercent, setYieldPercent] = useState("100");
  const [cookingLossPercent, setCookingLossPercent] = useState("0");
  const [prepNotes, setPrepNotes] = useState("");
  const [builderIngredients, setBuilderIngredients] = useState<Array<{ ingredientId: string; quantity: string; unitId: string }>>([]);

  const handleOpenCreate = () => {
    setLinkType("menu");
    setSelectedMenuItem(menuItemsList[0]?.id || "");
    setSelectedPrepIngredient(rawIngredients[0]?.id || "");
    setBuilderStatus("PUBLISHED");
    setYieldPercent("100");
    setCookingLossPercent("0");
    setPrepNotes("");
    setBuilderIngredients([{ ingredientId: rawIngredients[0]?.id || "", quantity: "1", unitId: "" }]);
    setBuilderOpen(true);
  };

  const handleOpenEdit = (recipe: RecipeItem) => {
    if (recipe.menuItemId) {
      setLinkType("menu");
      setSelectedMenuItem(recipe.menuItemId);
    } else if (recipe.ingredientId) {
      setLinkType("prep");
      setSelectedPrepIngredient(recipe.ingredientId);
    }
    setBuilderStatus(recipe.status);
    setYieldPercent(recipe.yieldPercent.toString());
    setCookingLossPercent(recipe.cookingLossPercent.toString());
    setPrepNotes(recipe.prepNotes || "");

    // Load breakdown to fetch actual ingredients detail for edit form
    setActiveRecipeId(recipe.id);
    setBuilderOpen(true);
  };

  // Sync edit builder ingredients once breakdown query completes
  React.useEffect(() => {
    if (builderOpen && activeBreakdown && activeRecipeId) {
      setBuilderIngredients(activeBreakdown.ingredients.map((i: any) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity.toString(),
        unitId: "" // defaults to base unit
      })));
    }
  }, [activeBreakdown, builderOpen]);

  // Form helpers
  const addIngredientRow = () => {
    setBuilderIngredients([...builderIngredients, { ingredientId: rawIngredients[0]?.id || "", quantity: "1", unitId: "" }]);
  };

  const removeIngredientRow = (index: number) => {
    if (builderIngredients.length > 1) {
      setBuilderIngredients(builderIngredients.filter((_, idx) => idx !== index));
    }
  };

  // Move ingredient up/down (accessible drag-and-drop ordering alternative)
  const moveIngredient = (index: number, direction: "up" | "down") => {
    const nextIdx = direction === "up" ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= builderIngredients.length) return;

    const list = [...builderIngredients];
    const temp = list[index];
    list[index] = list[nextIdx];
    list[nextIdx] = temp;
    setBuilderIngredients(list);
  };

  // Live Cost computation
  const liveCalculatedCost = useMemo(() => {
    let costSum = 0;
    builderIngredients.forEach((row: any) => {
      const ing = rawIngredients.find((i: InventoryItem) => i.id === row.ingredientId);
      if (ing) {
        costSum += Number(ing.costPerUnit) * (parseFloat(row.quantity) || 0);
      }
    });

    const yieldPct = parseFloat(yieldPercent) / 100;
    const lossPct = parseFloat(cookingLossPercent) / 100;

    let finalCost = costSum;
    if (yieldPct > 0) finalCost = finalCost / yieldPct;
    finalCost = finalCost * (1 + lossPct);

    return Number(finalCost.toFixed(2));
  }, [builderIngredients, rawIngredients, yieldPercent, cookingLossPercent]);

  // Submit form
  const handleBuilderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (builderIngredients.some((i) => !i.ingredientId || parseFloat(i.quantity) <= 0)) {
      toast.error("Please specify a valid ingredient and positive quantity values");
      return;
    }

    const payload = {
      menuItemId: linkType === "menu" ? selectedMenuItem : null,
      ingredientId: linkType === "prep" ? selectedPrepIngredient : null,
      status: builderStatus,
      yieldPercent: parseFloat(yieldPercent) || 100,
      cookingLossPercent: parseFloat(cookingLossPercent) || 0,
      prepNotes,
      ingredients: builderIngredients.map((i: any, idx: number) => ({
        ingredientId: i.ingredientId,
        quantity: parseFloat(i.quantity) || 0,
        unitId: i.unitId || null,
        sortOrder: idx
      }))
    };

    try {
      await saveRecipeMutation.mutateAsync(payload);
      toast.success("Recipe version saved successfully");
      setBuilderOpen(false);
      refetchDashboard();
      refetchRecipes();
      refetchVal();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save recipe");
    }
  };

  const handleOpenBreakdown = (recipeId: string) => {
    setActiveRecipeId(recipeId);
    setBreakdownOpen(true);
  };

  const hasActiveFilters = !!(listSearch || listStatusFilter !== "all");

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Kitchen Engineering</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Recipe Management</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Map menu items to raw ingredients, resolve recursive prep costs, audit variances, and analyze profit margins.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-11 items-center bg-white/5 p-1 rounded-xl mb-6 border border-white/5 w-fit">
          <TabsTrigger value="dashboard" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Dashboard</TabsTrigger>
          <TabsTrigger value="list" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Recipe Catalog</TabsTrigger>
          <TabsTrigger value="validation" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">
            Validations {validations.length > 0 && <span className="ml-1.5 bg-danger/20 text-danger text-[10px] font-bold px-1.5 py-0.5 rounded-full">{validations.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: RECIPE DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6 outline-none">
          {/* Action Hub Ribbon */}
          <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-fg">Recipe Architect</h4>
                <p className="text-xs text-fg-subtle">Define ingredient ratios and publish menu specifications.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleOpenCreate} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-1.5 h-9 font-semibold">
                <Plus className="w-4 h-4" /> Create Recipe
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Total Recipes</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">{dashboard?.totalRecipes || 0}</span>}
            </div>

            {/* KPI 2 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Missing Ingredients</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-danger mt-1.5">{dashboard?.missingIngredients || 0}</span>}
            </div>

            {/* KPI 3 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Average Recipe Cost</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">₹{dashboard?.averageRecipeCost || 0}</span>}
            </div>

            {/* KPI 4 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Validation Errors</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-warning mt-1.5">{dashboard?.errorsCount || 0}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List: Most Expensive */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-danger" /> Most Expensive Recipes (COGS)
              </h3>
              <div className="space-y-3">
                {isLoadingDashboard ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : !dashboard || dashboard.mostExpensiveRecipes.length === 0 ? (
                  <p className="text-xs text-fg-subtle py-4">No recipe cost data available.</p>
                ) : (
                  dashboard.mostExpensiveRecipes.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg-muted font-medium">{item.name}</span>
                      <span className="font-mono font-bold text-fg">₹{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* List: Lowest Margin */}
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-warning" /> Lowest Margin Recipes (Absolute ₹)
              </h3>
              <div className="space-y-3">
                {isLoadingDashboard ? (
                  <Skeleton className="h-20 w-full bg-white/5" />
                ) : !dashboard || dashboard.lowestMarginRecipes.length === 0 ? (
                  <p className="text-xs text-fg-subtle py-4">No recipe margin data available.</p>
                ) : (
                  dashboard.lowestMarginRecipes.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-fg-muted font-medium">{item.name}</span>
                      <span className="font-mono font-bold text-fg">₹{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: RECIPE CATALOG TABLE */}
        <TabsContent value="list" className="space-y-4 outline-none">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search recipe catalog by menu name or prep ingredient..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-[#141416] border border-white/10 rounded-xl text-fg placeholder:text-fg-subtle"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={listStatusFilter}
                onChange={(e) => setListStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none cursor-pointer min-w-[130px]"
              >
                <option value="all">All Statuses</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="DRAFT">Draft Only</option>
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-xs px-3 hover:bg-white/5 text-fg-subtle hover:text-fg cursor-pointer rounded-xl"
                  onClick={() => {
                    setListSearch("");
                    setListStatusFilter("all");
                  }}
                >
                  <X className="h-4 w-4 mr-1.5" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
            {isLoadingRecipes ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-16 text-xs text-fg-subtle">
                No recipes found. Create your first recipe configuration to map menu items.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent">
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Menu Item / Prep Ingredient</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Version</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Recipe Cost</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ingredient Count</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Food Cost %</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.map((item: RecipeItem) => {
                      const costPct = item.sellingPrice > 0 ? ((item.totalCost / item.sellingPrice) * 100).toFixed(1) : "-";
                      return (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01]">
                          <TableCell className="py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-fg text-sm">
                                {item.menuItemName || item.prepIngredientName}
                              </span>
                              <span className="text-[10px] text-fg-subtle mt-0.5">
                                {item.menuItemName ? "Finished Menu Item" : "In-House Prep Ingredient"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 font-mono text-xs text-fg-muted">
                            v{item.version}
                          </TableCell>
                          <TableCell className="py-3 font-mono font-bold text-sm text-fg">
                            ₹{item.totalCost}
                          </TableCell>
                          <TableCell className="py-3 font-mono text-xs text-fg-muted">
                            {item.ingredientCount} items
                          </TableCell>
                          <TableCell className="py-3 font-mono font-bold text-xs text-fg">
                            {costPct}%
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge className={cn("text-[9px] font-bold rounded px-1.5 py-0.5", item.status === "PUBLISHED" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenBreakdown(item.id)}
                                className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg cursor-pointer"
                                title="View Cost Breakdown"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="inline-grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg cursor-pointer"
                                title="Edit Recipe"
                              >
                                <PlusCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: RECIPE DIAGNOSTICS & VALIDATION */}
        <TabsContent value="validation" className="space-y-4 outline-none">
          <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex justify-between items-center">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-fg">Integrity Validation Audit</h4>
              <p className="text-xs text-fg-subtle">Audit database records to discover missing ingredient links or circular prep hierarchies.</p>
            </div>
            <Button onClick={() => refetchVal()} size="sm" variant="secondary" className="border border-white/10 text-fg rounded-xl h-9 hover:bg-white/5">
              Run Diagnostic Audit
            </Button>
          </div>

          <div className="space-y-3">
            {isLoadingVal ? (
              <div className="p-4"><Skeleton className="h-6 w-full bg-white/5" /></div>
            ) : validations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-white/5 bg-white/[0.01] rounded-2xl text-center gap-2">
                <CheckCircle className="w-8 h-8 text-success opacity-80" />
                <p className="text-xs font-semibold text-fg">Validation Audit Passed</p>
                <p className="text-[10px] text-fg-subtle">0 errors or mismatch logs found. Recipes structures are perfectly linked.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {validations.map((err: ValidationError, idx: number) => (
                  <div key={idx} className={cn("p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed", err.severity === "CRITICAL" ? "bg-danger/10 border-danger/20 text-danger" : err.severity === "ERROR" ? "bg-danger/10 border-danger/20 text-danger" : "bg-warning/10 border-warning/20 text-warning")}>
                    {err.severity === "CRITICAL" ? <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-white/15 mr-2">
                        {err.type}
                      </span>
                      <span>{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* DRAWER: RECIPE BUILDER */}
      <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              {activeRecipeId ? "Edit Recipe Details" : "Create Recipe Version"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleBuilderSubmit} className="space-y-6 p-6">
            {/* Section 1: Target Linkage */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Recipe Definition Linkage
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLinkType("menu")}
                    className={cn("h-10 text-xs border rounded-xl font-semibold cursor-pointer", linkType === "menu" ? "bg-accent/15 border-accent text-accent" : "border-white/10 hover:bg-white/5 text-fg-muted")}
                  >
                    Finished Menu Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkType("prep")}
                    className={cn("h-10 text-xs border rounded-xl font-semibold cursor-pointer", linkType === "prep" ? "bg-accent/15 border-accent text-accent" : "border-white/10 hover:bg-white/5 text-fg-muted")}
                  >
                    In-House Prep Ingredient
                  </button>
                </div>

                {linkType === "menu" ? (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-fg-muted">Menu Item *</Label>
                    <select
                      value={selectedMenuItem}
                      onChange={(e) => setSelectedMenuItem(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                      required
                    >
                      {menuItemsList.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name} (Price: ₹{m.price})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-fg-muted">Prep Ingredient *</Label>
                    <select
                      value={selectedPrepIngredient}
                      onChange={(e) => setSelectedPrepIngredient(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                      required
                    >
                      {rawIngredients.map((i: InventoryItem) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Ingredients list with drag-and-drop actions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <span>Recipe Ingredients Mapping</span>
                <button type="button" onClick={addIngredientRow} className="text-accent hover:text-accent-foreground text-[10px] font-bold flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> Add Ingredient
                </button>
              </div>

              <div className="space-y-3">
                {builderIngredients.map((row: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-3 relative">
                    {/* Ordering control ribbons */}
                    <div className="flex items-center gap-1.5 absolute right-2 top-2">
                      <button type="button" onClick={() => moveIngredient(idx, "up")} className="text-fg-subtle hover:text-fg disabled:opacity-30" disabled={idx === 0}>
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => moveIngredient(idx, "down")} className="text-fg-subtle hover:text-fg disabled:opacity-30" disabled={idx === builderIngredients.length - 1}>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {builderIngredients.length > 1 && (
                        <button type="button" onClick={() => removeIngredientRow(idx)} className="text-fg-subtle hover:text-danger ml-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Ingredient dropdown selector */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-fg-muted">Raw Material / Prep Recipe Ingredient</Label>
                      <select
                        value={row.ingredientId}
                        onChange={(e) => {
                          const list = [...builderIngredients];
                          list[idx].ingredientId = e.target.value;
                          setBuilderIngredients(list);
                        }}
                        className="w-[75%] h-9 px-2 text-xs bg-[#141416] border border-white/10 rounded-lg text-fg"
                        required
                      >
                        {rawIngredients.map((ing: InventoryItem) => (
                          <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-fg-muted">Quantity Mapping *</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={row.quantity}
                          onChange={(e) => {
                            const list = [...builderIngredients];
                            list[idx].quantity = e.target.value;
                            setBuilderIngredients(list);
                          }}
                          className="bg-[#141416] border-white/10 h-9 text-xs rounded-lg font-mono w-28"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Yield, Loss & Notes */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Prep Yield & Cooking Loss
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Yield Percentage (%) *</Label>
                  <Input
                    type="number"
                    step="1"
                    value={yieldPercent}
                    onChange={(e) => setYieldPercent(e.target.value)}
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Cooking Loss (%) *</Label>
                  <Input
                    type="number"
                    step="1"
                    value={cookingLossPercent}
                    onChange={(e) => setCookingLossPercent(e.target.value)}
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Preparation Notes</Label>
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Detail step-by-step cooking steps, baking temperatures..."
                  className="w-full min-h-[80px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                />
              </div>
            </div>

            {/* Section 4: Live margins calculator */}
            <div className="bg-accent/5 border border-accent/15 p-4 rounded-xl flex justify-between items-center text-xs">
              <span className="font-semibold text-accent flex items-center gap-1"><DollarSign className="w-4 h-4" /> Live Recipe Cost:</span>
              <span className="font-mono font-bold text-sm text-accent">₹{liveCalculatedCost}</span>
            </div>

            {/* Section 5: Version Status */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Status</Label>
              <select
                value={builderStatus}
                onChange={(e) => setBuilderStatus(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
              >
                <option value="PUBLISHED">Published (Active version)</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setBuilderOpen(false)} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={saveRecipeMutation.isPending}>
                Save Recipe version
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* DIALOG: COST BREAKDOWN DETAIL */}
      <Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
        <DialogContent className="bg-[#0F0F10] border border-white/5 text-fg max-w-2xl overflow-y-auto">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Recipe Cost & Margin Analysis
            </DialogTitle>
          </DialogHeader>

          {isLoadingBreakdown || !activeBreakdown ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full bg-white/5" />
              <Skeleton className="h-8 w-full bg-white/5" />
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Target headers info */}
              <div className="flex justify-between items-start text-xs border-b border-white/5 pb-3">
                <div>
                  <span className="text-[10px] text-fg-subtle uppercase font-bold">Menu Target</span>
                  <h4 className="text-base font-bold text-fg mt-0.5">{activeBreakdown.menuItemName || activeBreakdown.prepIngredientName}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-fg-subtle uppercase font-bold">Recipe Version</span>
                  <p className="font-mono text-sm font-bold text-fg mt-0.5">v{activeBreakdown.version} ({activeBreakdown.status})</p>
                </div>
              </div>

              {/* Financial Margin stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[9px] text-fg-subtle uppercase font-semibold">Total COGS Cost</span>
                  <p className="text-base font-bold text-fg mt-1">₹{activeBreakdown.totalRecipeCost}</p>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[9px] text-fg-subtle uppercase font-semibold">Selling Price</span>
                  <p className="text-base font-bold text-fg mt-1">₹{activeBreakdown.sellingPrice}</p>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[9px] text-fg-subtle uppercase font-semibold">Gross Profit Margin</span>
                  <p className={cn("text-base font-bold mt-1", activeBreakdown.grossMargin >= 0 ? "text-success" : "text-danger")}>
                    ₹{activeBreakdown.grossMargin} ({activeBreakdown.foodCostPercent}%)
                  </p>
                </div>
              </div>

              {/* Breakdown breakdown table */}
              <div className="border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                      <TableHead className="h-8 text-[9px] text-fg-subtle">Ingredient</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle w-24 text-right">Qty</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle w-24 text-right">Unit Cost</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle w-24 text-right">Ext Cost</TableHead>
                      <TableHead className="h-8 text-[9px] text-fg-subtle w-20 text-right">Contrib %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBreakdown.ingredients.map((ing: any, idx: number) => (
                      <TableRow key={idx} className="border-white/5">
                        <TableCell className="py-2.5 font-semibold text-fg text-xs">{ing.name}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs text-fg-muted">{ing.quantity} {ing.unit}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs text-fg-muted">₹{ing.unitCost}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs text-fg font-bold">₹{ing.extendedCost}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs text-accent font-bold">{ing.contributionPercent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              {activeBreakdown.prepNotes && (
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs space-y-1.5">
                  <span className="font-semibold text-fg flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Prep & Yield Notes:</span>
                  <p className="text-fg-subtle leading-relaxed text-[11px] italic font-medium">"{activeBreakdown.prepNotes}"</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
