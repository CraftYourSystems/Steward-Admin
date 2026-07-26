"use client";

import React, { useState, useMemo } from "react";
import {
  useInventoryOperationsDashboard,
  useStockMovements,
  useReceiveStock,
  useAdjustStock,
  useRecordWaste,
  usePhysicalCountSessions,
  useCreatePhysicalCountSession,
  useSavePhysicalCountItems,
  useApprovePhysicalCount,
  StockMovement,
  PhysicalCountSession,
  PhysicalCountItem,
} from "@/hooks/useInventoryOperations";
import {
  useInventoryItems,
  useSuppliers,
  InventoryItem,
  Supplier,
} from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InventoryOperationsView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Backend queries
  const { data: dashboard, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useInventoryOperationsDashboard();
  const { data: stockItems = [], isLoading: isLoadingItems } = useInventoryItems();
  const { data: suppliersList = [] } = useSuppliers();
  const { data: countSessions = [], isLoading: isLoadingCounts, refetch: refetchCounts } = usePhysicalCountSessions();

  // Ledger Filter states
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [ledgerIngredientFilter, setLedgerIngredientFilter] = useState("all");

  const ledgerFilters = useMemo(() => ({
    search: ledgerSearch,
    movementType: ledgerTypeFilter === "all" ? undefined : ledgerTypeFilter,
    ingredientId: ledgerIngredientFilter === "all" ? undefined : ledgerIngredientFilter
  }), [ledgerSearch, ledgerTypeFilter, ledgerIngredientFilter]);

  const { data: movements = [], isLoading: isLoadingLedger } = useStockMovements(ledgerFilters);
  const hasActiveFilters = !!(ledgerSearch || ledgerTypeFilter !== "all" || ledgerIngredientFilter !== "all");

  // Mutations
  const receiveMutation = useReceiveStock();
  const adjustMutation = useAdjustStock();
  const wasteMutation = useRecordWaste();
  const startCountMutation = useCreatePhysicalCountSession();
  const saveCountMutation = useSavePhysicalCountItems();
  const approveCountMutation = useApprovePhysicalCount();

  // Drawers UI trigger state
  const [drawerOpen, setDrawerOpen] = useState<"none" | "receive" | "adjust" | "waste">("none");

  // Receive Form states
  const [receiveSupplier, setReceiveSupplier] = useState("");
  const [receiveInvoice, setReceiveInvoice] = useState("");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [receiveItems, setReceiveItems] = useState<Array<{ ingredientId: string; quantity: string; unitCost: string }>>([
    { ingredientId: "", quantity: "0", unitCost: "0" }
  ]);

  // Adjust Form states
  const [adjustIngredient, setAdjustIngredient] = useState("");
  const [adjustType, setAdjustType] = useState<"increase" | "decrease">("increase");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");

  // Waste Form states
  const [wasteIngredient, setWasteIngredient] = useState("");
  const [wasteQty, setWasteQty] = useState("");
  const [wasteReason, setWasteReason] = useState("");
  const [wasteNotes, setWasteNotes] = useState("");

  // Active Count Session sheet
  const activeCountSession = useMemo(() => {
    return countSessions.find((s: PhysicalCountSession) => s.status === "PENDING");
  }, [countSessions]);

  const [countRecords, setCountRecords] = useState<Record<string, string>>({});

  // Initialize counting values when session opens
  React.useEffect(() => {
    if (activeCountSession) {
      const records: Record<string, string> = {};
      activeCountSession.items.forEach((item: PhysicalCountItem) => {
        records[item.id] = item.recordedQty.toString();
      });
      setCountRecords(records);
    }
  }, [activeCountSession]);

  // Open Receive drawer
  const handleOpenReceive = () => {
    setReceiveSupplier(suppliersList[0]?.id || "");
    setReceiveInvoice("");
    setReceiveNotes("");
    setReceiveItems([{ ingredientId: stockItems[0]?.id || "", quantity: "0", unitCost: "0" }]);
    setDrawerOpen("receive");
  };

  // Open Adjust drawer
  const handleOpenAdjust = () => {
    setAdjustIngredient(stockItems[0]?.id || "");
    setAdjustType("increase");
    setAdjustQty("0");
    setAdjustReason("Damaged Package Recovery");
    setAdjustNotes("");
    setDrawerOpen("adjust");
  };

  // Open Waste drawer
  const handleOpenWaste = () => {
    setWasteIngredient(stockItems[0]?.id || "");
    setWasteQty("0");
    setWasteReason("Expiration Date Met");
    setWasteNotes("");
    setDrawerOpen("waste");
  };

  // Dynamically add item row in receive form
  const addReceiveRow = () => {
    setReceiveItems([...receiveItems, { ingredientId: stockItems[0]?.id || "", quantity: "0", unitCost: "0" }]);
  };

  // Dynamically remove item row in receive form
  const removeReceiveRow = (index: number) => {
    if (receiveItems.length > 1) {
      setReceiveItems(receiveItems.filter((_, idx) => idx !== index));
    }
  };

  // Form Submission handlers
  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveSupplier || receiveItems.some((item) => !item.ingredientId || parseFloat(item.quantity) <= 0)) {
      toast.error("Please specify a valid supplier and item quantities");
      return;
    }

    try {
      await receiveMutation.mutateAsync({
        supplierId: receiveSupplier,
        invoiceNumber: receiveInvoice,
        notes: receiveNotes,
        items: receiveItems.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: parseFloat(i.quantity) || 0,
          unitCost: parseFloat(i.unitCost) || 0
        }))
      });
      toast.success("Stock received successfully");
      setDrawerOpen("none");
      refetchDashboard();
    } catch (err: any) {
      toast.error(err?.message || "Failed to receive stock");
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(adjustQty) || 0;
    if (!adjustIngredient || qty <= 0) {
      toast.error("Please specify a valid ingredient and quantity");
      return;
    }

    const signedQty = adjustType === "increase" ? qty : -qty;

    try {
      await adjustMutation.mutateAsync({
        ingredientId: adjustIngredient,
        quantity: signedQty,
        reason: adjustReason,
        notes: adjustNotes
      });
      toast.success("Inventory adjusted successfully");
      setDrawerOpen("none");
      refetchDashboard();
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust stock");
    }
  };

  const handleWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(wasteQty) || 0;
    if (!wasteIngredient || qty <= 0) {
      toast.error("Please specify a valid ingredient and quantity");
      return;
    }

    try {
      await wasteMutation.mutateAsync({
        ingredientId: wasteIngredient,
        quantity: qty,
        reason: wasteReason,
        notes: wasteNotes
      });
      toast.success("Waste recorded successfully");
      setDrawerOpen("none");
      refetchDashboard();
    } catch (err: any) {
      toast.error(err?.message || "Failed to log waste");
    }
  };

  // Start physical count session
  const handleStartPhysicalCount = async () => {
    try {
      await startCountMutation.mutateAsync();
      toast.success("New physical count sheet started");
      setActiveTab("count");
      refetchCounts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to start count sheet");
    }
  };

  // Save counted items values
  const handleSaveCountItems = async () => {
    if (!activeCountSession) return;
    const itemsPayload = Object.keys(countRecords).map((itemId) => ({
      itemId,
      recordedQty: parseFloat(countRecords[itemId]) || 0
    }));

    try {
      await saveCountMutation.mutateAsync({
        sessionId: activeCountSession.id,
        items: itemsPayload
      });
      toast.success("Count sheet saved successfully");
      refetchCounts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save counts");
    }
  };

  // Approve adjustments
  const handleApproveCount = async () => {
    if (!activeCountSession) return;
    if (confirm("Are you sure you want to approve this count sheet? Adjustments will be posted to the ledger for any variances found.")) {
      try {
        await approveCountMutation.mutateAsync(activeCountSession.id);
        toast.success("Count approved. Inventory has been updated.");
        refetchCounts();
        refetchDashboard();
      } catch (err: any) {
        toast.error(err?.message || "Failed to approve count session");
      }
    }
  };

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Stock Ledger</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Inventory Operations</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Execute receiving operations, log spillage/waste, adjust ledgers, and manage stocktaking counts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-11 items-center bg-white/5 p-1 rounded-xl mb-6 border border-white/5 w-fit">
          <TabsTrigger value="dashboard" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Dashboard</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Stock Movements</TabsTrigger>
          <TabsTrigger value="count" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Physical Count</TabsTrigger>
        </TabsList>

        {/* TAB 1: OPERATIONS DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6 outline-none">
          {/* Action Hub Ribbon */}
          <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-fg">Operations Hub</h4>
                <p className="text-xs text-fg-subtle">Log inventory transactions immediately as they occur.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleOpenReceive} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-1.5 h-9 font-semibold">
                <Plus className="w-4 h-4" /> Receive Stock
              </Button>
              <Button onClick={handleOpenAdjust} size="sm" variant="secondary" className="border border-white/10 text-fg rounded-xl gap-1.5 h-9 font-semibold hover:bg-white/5">
                <TrendingUp className="w-4 h-4" /> Adjust Stock
              </Button>
              <Button onClick={handleOpenWaste} size="sm" variant="secondary" className="border border-white/10 text-fg rounded-xl gap-1.5 h-9 font-semibold hover:bg-white/5">
                <TrendingDown className="w-4 h-4" /> Record Waste
              </Button>
              <Button onClick={handleStartPhysicalCount} size="sm" variant="secondary" className="border border-white/10 text-fg rounded-xl gap-1.5 h-9 font-semibold hover:bg-white/5">
                <Scale className="w-4 h-4" /> Physical Count
              </Button>
            </div>
          </div>

          {/* Today's KPI Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* KPI 1 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Movements Today</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">{dashboard?.totalMovements || 0}</span>}
            </div>

            {/* KPI 2 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Stock Received</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-success mt-1.5">+{dashboard?.receivedQty || 0}</span>}
            </div>

            {/* KPI 3 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Stock Consumed</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">-{dashboard?.consumedQty || 0}</span>}
            </div>

            {/* KPI 4 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Waste Recorded</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-danger mt-1.5">-{dashboard?.wasteQty || 0}</span>}
            </div>

            {/* KPI 5 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ledger Adjustments</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-accent mt-1.5">{dashboard?.adjustmentsQty !== undefined && dashboard.adjustmentsQty >= 0 ? `+${dashboard.adjustmentsQty}` : dashboard?.adjustmentsQty || 0}</span>}
            </div>

            {/* KPI 6 */}
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Pending Sheets</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">{dashboard?.pendingCount || 0}</span>}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Operational Activity Ledger
            </h3>

            {isLoadingDashboard ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-10 w-full bg-white/5 rounded-lg" />
              </div>
            ) : !dashboard || dashboard.timeline.length === 0 ? (
              <div className="text-center py-8 text-xs text-fg-subtle">
                No recent activity logged. Start receive or adjustment workflows to build the timeline ledger.
              </div>
            ) : (
              <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-5">
                {dashboard.timeline.map((event: any) => (
                  <div key={event.id} className="relative text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    {/* Circle marker */}
                    <div className="absolute -left-6.5 top-1 w-2.5 h-2.5 rounded-full border border-accent bg-[#0B0B0C]" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-fg-muted">{event.time}</span>
                        <span className="text-fg-subtle">•</span>
                        <span className="font-bold text-fg">{event.ingredientName}</span>
                        <Badge className={cn("text-[9px] font-bold rounded px-1.5 py-0", event.type === "RECEIVING" ? "bg-success/15 text-success" : event.type === "WASTE" ? "bg-danger/15 text-danger" : "bg-white/5 text-fg-subtle")}>
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-fg-muted mt-1 italic font-medium">"{event.reason}"</p>
                    </div>
                    <span className={cn("font-mono font-bold text-right", event.quantity > 0 ? "text-success" : "text-danger")}>
                      {event.quantity > 0 ? `+${event.quantity}` : event.quantity} {event.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: STOCK MOVEMENTS LEDGER TABLE */}
        <TabsContent value="ledger" className="space-y-4 outline-none">
          {/* Filters toolbar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search ledger by invoice #, adjustment reasons..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-[#141416] border border-white/10 rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type filter */}
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[130px]"
              >
                <option value="all">All Types</option>
                <option value="RECEIVING">Receiving</option>
                <option value="SALE_DEDUCTION">Sale Deduction</option>
                <option value="MANUAL_ADJUSTMENT">Adjustment</option>
                <option value="WASTE">Waste</option>
                <option value="PHYSICAL_COUNT">Physical Count</option>
              </select>

              {/* Ingredient filter */}
              <select
                value={ledgerIngredientFilter}
                onChange={(e) => setLedgerIngredientFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none focus:border-white/20 transition-colors cursor-pointer min-w-[130px]"
              >
                <option value="all">All Ingredients</option>
                {stockItems.map((item: InventoryItem) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-xs px-3 hover:bg-white/5 text-fg-subtle hover:text-fg cursor-pointer rounded-xl"
                  onClick={() => {
                    setLedgerSearch("");
                    setLedgerTypeFilter("all");
                    setLedgerIngredientFilter("all");
                  }}
                >
                  <X className="h-4 w-4 mr-1.5" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
            {isLoadingLedger ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-16 text-xs text-fg-subtle">
                No movements ledger record matches your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent">
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Date / Time</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ingredient</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Type</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Quantity</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Prev Stock</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">New Stock</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Reference</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mv: StockMovement) => {
                      const qty = Number(mv.quantity);
                      return (
                        <TableRow key={mv.id} className="border-white/5 hover:bg-white/[0.01]">
                          <TableCell className="py-3 text-xs text-fg-muted font-mono">
                            {new Date(mv.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-3 font-semibold text-fg text-sm">
                            {mv.ingredient.name}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge className={cn("text-[9px] font-bold py-0.5 rounded px-2", mv.movementType === "RECEIVING" ? "bg-success/10 text-success border-none" : mv.movementType === "WASTE" ? "bg-danger/10 text-danger border-none" : "bg-white/5 text-fg-muted border-none")}>
                              {mv.movementType}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn("py-3 font-mono font-bold text-sm", qty > 0 ? "text-success" : "text-danger")}>
                            {qty > 0 ? `+${qty}` : qty} {mv.ingredient.unit}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-fg-muted font-mono">
                            {Number(mv.previousStock)} {mv.ingredient.unit}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-fg font-mono font-bold">
                            {Number(mv.newStock)} {mv.ingredient.unit}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-fg-muted font-mono">
                            {mv.reference || "-"}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-fg-muted max-w-[200px] truncate" title={mv.reason || ""}>
                            {mv.reason || "-"}
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

        {/* TAB 3: PHYSICAL COUNT WORKFLOW */}
        <TabsContent value="count" className="space-y-6 outline-none">
          {activeCountSession ? (
            /* Active stocktaking sheet layout */
            <div className="space-y-4">
              <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-accent/15 text-accent font-bold">COUNTING SESSION IN PROGRESS</Badge>
                    <span className="text-xs text-fg-subtle">ID: {activeCountSession.id}</span>
                  </div>
                  <p className="text-xs text-fg-subtle">Started at {new Date(activeCountSession.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleSaveCountItems} variant="outline" className="border-white/10 text-fg rounded-xl h-9 hover:bg-white/5 cursor-pointer">
                    Save Draft Sheet
                  </Button>
                  <Button onClick={handleApproveCount} className="bg-success hover:bg-success/90 text-success-foreground font-semibold rounded-xl h-9 cursor-pointer">
                    Approve Adjustments
                  </Button>
                </div>
              </div>

              {/* Counting form table */}
              <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent">
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Ingredient Name</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle w-40">Expected (System Stock)</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle w-48">Counted Qty</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle w-32 text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCountSession.items.map((item: PhysicalCountItem) => {
                      const expected = Number(item.expectedQty);
                      const recorded = parseFloat(countRecords[item.id]) || 0;
                      const variance = recorded - expected;

                      return (
                        <TableRow key={item.id} className="border-white/5">
                          <TableCell className="py-3 font-semibold text-fg text-sm">
                            {item.ingredient.name}
                          </TableCell>
                          <TableCell className="py-3 font-mono text-xs text-fg-muted">
                            {expected} {item.ingredient.unit}
                          </TableCell>
                          <TableCell className="py-2 w-48">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={countRecords[item.id] || ""}
                                onChange={(e) => setCountRecords({ ...countRecords, [item.id]: e.target.value })}
                                className="bg-[#141416] border-white/10 h-8 text-xs font-mono rounded-lg w-28 text-fg"
                              />
                              <span className="text-[11px] text-fg-subtle">{item.ingredient.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn("py-3 text-right font-mono font-bold text-xs", variance === 0 ? "text-fg-subtle" : variance > 0 ? "text-success" : "text-danger")}>
                            {variance === 0 ? "0" : variance > 0 ? `+${variance}` : variance} {item.ingredient.unit}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* Open sheet start layout */
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] p-12 rounded-2xl text-center gap-3">
                <Scale className="w-10 h-10 text-fg-subtle opacity-50 mb-1" />
                <h4 className="text-sm font-semibold text-fg">No physical count sheet is currently open</h4>
                <p className="text-xs text-fg-subtle max-w-sm leading-relaxed">
                  Start a count session to audit inventory items, compute real-time variance formulas, and post correction ledgers.
                </p>
                <Button onClick={handleStartPhysicalCount} className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-9 mt-2">
                  Generate Count Sheet
                </Button>
              </div>

              {/* History list */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-1.5"><History className="w-4 h-4" /> Past Audits & Variance Reports</h3>
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                  {isLoadingCounts ? (
                    <div className="p-4"><Skeleton className="h-6 w-full bg-white/5" /></div>
                  ) : countSessions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-fg-subtle italic">No past count history found.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 bg-transparent">
                          <TableHead className="h-9 text-[10px] font-semibold text-fg-subtle">Audit ID</TableHead>
                          <TableHead className="h-9 text-[10px] font-semibold text-fg-subtle">Date Completed</TableHead>
                          <TableHead className="h-9 text-[10px] font-semibold text-fg-subtle">Assigned User ID</TableHead>
                          <TableHead className="h-9 text-[10px] font-semibold text-fg-subtle">Variance Metrics</TableHead>
                          <TableHead className="h-9 text-[10px] font-semibold text-fg-subtle">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {countSessions.map((session: PhysicalCountSession) => {
                          const totalVarianceCount = session.items.filter((i: PhysicalCountItem) => Number(i.variance) !== 0).length;
                          return (
                            <TableRow key={session.id} className="border-white/5">
                              <TableCell className="py-2.5 font-mono text-xs text-fg-muted">{session.id}</TableCell>
                              <TableCell className="py-2.5 text-xs text-fg-muted">{new Date(session.updatedAt).toLocaleString()}</TableCell>
                              <TableCell className="py-2.5 text-xs text-fg-muted font-mono">{session.userId}</TableCell>
                              <TableCell className="py-2.5 text-xs text-fg font-bold">
                                {totalVarianceCount > 0 ? (
                                  <span className="text-danger flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {totalVarianceCount} Item Variance(s)</span>
                                ) : (
                                  <span className="text-success flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> Matches Expected</span>
                                )}
                              </TableCell>
                              <TableCell className="py-2.5">
                                <Badge className={cn("text-[9px] px-2 py-0.5 rounded-full border-none", session.status === "APPROVED" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                                  {session.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DRAWERS FOR ACTIONS */}
      <Sheet open={drawerOpen !== "none"} onOpenChange={() => setDrawerOpen("none")}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              {drawerOpen === "receive" && "Receive Stock Order"}
              {drawerOpen === "adjust" && "Manual Stock Adjustment"}
              {drawerOpen === "waste" && "Log Spoiled/Waste Stock"}
            </SheetTitle>
          </SheetHeader>

          {/* RECEIVE STOCK FORM */}
          {drawerOpen === "receive" && (
            <form onSubmit={handleReceiveSubmit} className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Supplier *</Label>
                  <select
                    value={receiveSupplier}
                    onChange={(e) => setReceiveSupplier(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                    required
                  >
                    {suppliersList.map((s: Supplier) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Invoice Number</Label>
                  <Input
                    value={receiveInvoice}
                    onChange={(e) => setReceiveInvoice(e.target.value)}
                    placeholder="e.g. INV-2026-987"
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                  />
                </div>

                {/* Items rows */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                    <span>Items Received</span>
                    <button type="button" onClick={addReceiveRow} className="text-accent hover:text-accent-foreground text-[10px] font-bold flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  {receiveItems.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-3 relative">
                      {receiveItems.length > 1 && (
                        <button type="button" onClick={() => removeReceiveRow(idx)} className="absolute right-2.5 top-2.5 text-fg-subtle hover:text-danger">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Ingredient selector */}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-fg-muted">Ingredient *</Label>
                        <select
                          value={item.ingredientId}
                          onChange={(e) => {
                            const newItems = [...receiveItems];
                            newItems[idx].ingredientId = e.target.value;
                            setReceiveItems(newItems);
                          }}
                          className="w-full h-9 px-2 text-xs bg-[#141416] border border-white/10 rounded-lg text-fg"
                          required
                        >
                          <option value="" disabled>Select ingredient</option>
                          {stockItems.map((ing: InventoryItem) => (
                            <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-fg-muted">Quantity *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...receiveItems];
                              newItems[idx].quantity = e.target.value;
                              setReceiveItems(newItems);
                            }}
                            className="bg-[#141416] border-white/10 h-9 text-xs rounded-lg font-mono"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-fg-muted">Unit Cost *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => {
                              const newItems = [...receiveItems];
                              newItems[idx].unitCost = e.target.value;
                              setReceiveItems(newItems);
                            }}
                            className="bg-[#141416] border-white/10 h-9 text-xs rounded-lg font-mono"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Notes</Label>
                  <textarea
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    placeholder="Provide shipping instructions, order quality notes..."
                    className="w-full min-h-[70px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-6">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen("none")} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={receiveMutation.isPending}>
                  Receive Stock
                </Button>
              </div>
            </form>
          )}

          {/* MANUAL ADJUSTMENT FORM */}
          {drawerOpen === "adjust" && (
            <form onSubmit={handleAdjustSubmit} className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Ingredient *</Label>
                  <select
                    value={adjustIngredient}
                    onChange={(e) => setAdjustIngredient(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                    required
                  >
                    {stockItems.map((ing: InventoryItem) => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Adjustment Action</Label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                  >
                    <option value="increase">Increase stock (Addition)</option>
                    <option value="decrease">Decrease stock (Deduction)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Quantity *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Adjustment Reason *</Label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                    required
                  >
                    <option value="Damaged Package Recovery">Damaged Package Recovery</option>
                    <option value="Recipe Correction">Recipe Correction</option>
                    <option value="System Sync Correction">System Sync Correction</option>
                    <option value="Re-count adjustment">Re-count adjustment</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Internal Notes</Label>
                  <textarea
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="Log detail notes of the ledger correction..."
                    className="w-full min-h-[80px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-6">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen("none")} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={adjustMutation.isPending}>
                  Post Adjustment
                </Button>
              </div>
            </form>
          )}

          {/* WASTE LOG FORM */}
          {drawerOpen === "waste" && (
            <form onSubmit={handleWasteSubmit} className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Ingredient *</Label>
                  <select
                    value={wasteIngredient}
                    onChange={(e) => setWasteIngredient(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                    required
                  >
                    {stockItems.map((ing: InventoryItem) => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Quantity to Deduct *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={wasteQty}
                    onChange={(e) => setWasteQty(e.target.value)}
                    className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Waste Reason *</Label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                    required
                  >
                    <option value="Expiration Date Met">Expiration Date Met</option>
                    <option value="Spoiled during service">Spoiled during service</option>
                    <option value="Accidental Spillage">Accidental Spillage</option>
                    <option value="Overcooked/Burned waste">Overcooked/Burned waste</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Internal Notes</Label>
                  <textarea
                    value={wasteNotes}
                    onChange={(e) => setWasteNotes(e.target.value)}
                    placeholder="Log detail notes of the spillage..."
                    className="w-full min-h-[80px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-6">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen("none")} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={wasteMutation.isPending}>
                  Log Waste Record
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
