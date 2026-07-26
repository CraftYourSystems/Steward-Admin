"use client";

import React, { useState, useMemo } from "react";
import {
  useProcurementDashboard,
  useSuppliers,
  useSaveSupplier,
  useArchiveSupplier,
  useMergeSuppliers,
  usePurchaseOrders,
  useCreatePO,
  useReceiveGoods,
  SupplierRecord,
  PurchaseOrderRecord,
} from "@/hooks/useProcurement";
import {
  useInventoryItems,
  InventoryItem,
} from "@/hooks/useInventoryAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  X,
  Truck,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
  Calculator,
  Calendar,
  Layers,
  ArrowRight,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  Users,
  PlusCircle,
  Trash2,
  Activity,
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

export function InventoryProcurementView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Query hooks
  const { data: dashboard, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useProcurementDashboard();
  const { data: suppliers = [], isLoading: isLoadingSuppliers, refetch: refetchSuppliers } = useSuppliers();
  const { data: pos = [], isLoading: isLoadingPOs, refetch: refetchPOs } = usePurchaseOrders();
  const { data: rawIngredients = [], isLoading: isLoadingIng } = useInventoryItems();

  const saveSupplierMutation = useSaveSupplier();
  const archiveSupplierMutation = useArchiveSupplier();
  const mergeSuppliersMutation = useMergeSuppliers();
  const createPOMutation = useCreatePO();
  const receiveGoodsMutation = useReceiveGoods();

  // Local UI states
  const [supplierDrawerOpen, setSupplierDrawerOpen] = useState(false);
  const [mergeDrawerOpen, setMergeDrawerOpen] = useState(false);
  const [poDrawerOpen, setPoDrawerOpen] = useState(false);
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);

  const [activeSupplier, setActiveSupplier] = useState<SupplierRecord | null>(null);
  const [activePO, setActivePO] = useState<PurchaseOrderRecord | null>(null);

  // Supplier Form State
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supNotes, setSupNotes] = useState("");
  const [supTerms, setSupTerms] = useState("Net 30");
  const [supLeadTime, setSupLeadTime] = useState("3");
  const [supPreferred, setSupPreferred] = useState(false);

  // Merge Form State
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");

  // PO Builder State
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poDeliveryDate, setPoDeliveryDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poItems, setPoItems] = useState<Array<{ ingredientId: string; orderedQty: string; unitCost: string; discountAmount: string }>>([]);

  // Goods Receipt State
  const [recInvoiceNumber, setRecInvoiceNumber] = useState("");
  const [recItems, setRecItems] = useState<Array<{ ingredientId: string; name: string; orderedQty: number; receivedQty: string; damagedQty: string; rejectedQty: string; unitCost: string }>>([]);

  // Supplier CRM handlers
  const handleOpenCreateSupplier = () => {
    setActiveSupplier(null);
    setSupName("");
    setSupPhone("");
    setSupEmail("");
    setSupAddress("");
    setSupNotes("");
    setSupTerms("Net 30");
    setSupLeadTime("3");
    setSupPreferred(false);
    setSupplierDrawerOpen(true);
  };

  const handleOpenEditSupplier = (sup: SupplierRecord) => {
    setActiveSupplier(sup);
    setSupName(sup.name);
    setSupPhone(sup.phone || "");
    setSupEmail(sup.email || "");
    setSupAddress(sup.address || "");
    setSupNotes(sup.notes || "");
    setSupTerms(sup.paymentTerms || "Net 30");
    setSupLeadTime(sup.leadTimeDays.toString());
    setSupPreferred(sup.isPreferred);
    setSupplierDrawerOpen(true);
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;

    try {
      await saveSupplierMutation.mutateAsync({
        id: activeSupplier?.id,
        name: supName,
        phone: supPhone,
        email: supEmail,
        address: supAddress,
        notes: supNotes,
        paymentTerms: supTerms,
        leadTimeDays: parseInt(supLeadTime) || 3,
        isPreferred: supPreferred
      });
      toast.success("Supplier profile saved successfully");
      setSupplierDrawerOpen(false);
      refetchSuppliers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save supplier");
    }
  };

  const handleArchiveSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to archive this supplier?")) return;
    try {
      await archiveSupplierMutation.mutateAsync(id);
      toast.success("Supplier archived");
      refetchSuppliers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive supplier");
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceId || !mergeTargetId) return;

    try {
      await mergeSuppliersMutation.mutateAsync({
        sourceId: mergeSourceId,
        targetId: mergeTargetId
      });
      toast.success("Suppliers merged successfully");
      setMergeDrawerOpen(false);
      refetchSuppliers();
      refetchDashboard();
    } catch (err: any) {
      toast.error(err?.message || "Failed to merge suppliers");
    }
  };

  // PO Builder helpers
  const handleOpenPOBuilder = () => {
    if (suppliers.length === 0) {
      toast.error("Please add a supplier before generating purchase orders.");
      return;
    }
    setPoSupplierId(suppliers[0].id);
    setPoDeliveryDate("");
    setPoNotes("");
    setPoItems([{ ingredientId: rawIngredients[0]?.id || "", orderedQty: "10", unitCost: "100", discountAmount: "0" }]);
    setPoDrawerOpen(true);
  };

  const addPOItemRow = () => {
    setPoItems([...poItems, { ingredientId: rawIngredients[0]?.id || "", orderedQty: "10", unitCost: "100", discountAmount: "0" }]);
  };

  const removePOItemRow = (idx: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== idx));
    }
  };

  const poLiveCalculations = useMemo(() => {
    let subTotal = 0;
    poItems.forEach((row) => {
      const qty = parseFloat(row.orderedQty) || 0;
      const cost = parseFloat(row.unitCost) || 0;
      const disc = parseFloat(row.discountAmount) || 0;
      subTotal += (qty * cost) - disc;
    });

    return {
      subTotal: Number(subTotal.toFixed(2)),
      tax: Number((subTotal * 0.05).toFixed(2)), // 5% mock tax
      grandTotal: Number((subTotal * 1.05).toFixed(2))
    };
  }, [poItems]);

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.some((i) => !i.ingredientId || parseFloat(i.orderedQty) <= 0)) {
      toast.error("Please specify a valid ingredient and positive quantity values");
      return;
    }

    try {
      await createPOMutation.mutateAsync({
        supplierId: poSupplierId,
        expectedDelivery: poDeliveryDate || undefined,
        notes: poNotes,
        status: "SENT", // directly sends PO
        items: poItems.map((item) => ({
          ingredientId: item.ingredientId,
          orderedQty: parseFloat(item.orderedQty) || 0,
          unitCost: parseFloat(item.unitCost) || 0,
          discountAmount: parseFloat(item.discountAmount) || 0
        }))
      });
      toast.success("Purchase Order issued and sent to vendor");
      setPoDrawerOpen(false);
      refetchPOs();
      refetchDashboard();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create PO");
    }
  };

  // Goods Receipt helpers
  const handleOpenReceipt = (po: PurchaseOrderRecord) => {
    setActivePO(po);
    setRecInvoiceNumber("");
    setRecItems(po.items.map((i) => ({
      ingredientId: i.ingredientId,
      name: i.ingredient.name,
      orderedQty: i.orderedQty,
      receivedQty: (i.orderedQty - i.receivedQty).toString(), // defaults to remaining quantity
      damagedQty: "0",
      rejectedQty: "0",
      unitCost: i.unitCost.toString()
    })));
    setReceiptDrawerOpen(true);
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO) return;

    try {
      await receiveGoodsMutation.mutateAsync({
        purchaseOrderId: activePO.id,
        invoiceNumber: recInvoiceNumber,
        items: recItems.map((item) => ({
          ingredientId: item.ingredientId,
          receivedQty: parseFloat(item.receivedQty) || 0,
          damagedQty: parseFloat(item.damagedQty) || 0,
          rejectedQty: parseFloat(item.rejectedQty) || 0,
          unitCost: parseFloat(item.unitCost) || 0
        }))
      });
      toast.success("Goods Receipt processed successfully. Stock levels updated.");
      setReceiptDrawerOpen(false);
      refetchPOs();
      refetchDashboard();
    } catch (err: any) {
      toast.error(err?.message || "Failed to process Goods Receipt");
    }
  };

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1500px] mx-auto text-fg bg-[#0B0B0C] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs text-accent font-semibold uppercase tracking-wider mb-1">Procurement Management</div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Inventory Procurement</h2>
          <p className="text-sm text-fg-subtle mt-1">
            Manage purchasing lifecycles, configure vendors, draft PO orders, and reconcile deliveries.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-11 items-center bg-white/5 p-1 rounded-xl mb-6 border border-white/5 w-fit">
          <TabsTrigger value="dashboard" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Dashboard</TabsTrigger>
          <TabsTrigger value="purchase-orders" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs font-semibold data-[state=active]:bg-white/10 px-4 py-2 rounded-lg cursor-pointer">Supplier Directory</TabsTrigger>
        </TabsList>

        {/* TAB 1: procurement dashboard */}
        <TabsContent value="dashboard" className="space-y-6 outline-none">
          {/* Action Hub Ribbon */}
          <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-fg">Procurement Operations</h4>
                <p className="text-xs text-fg-subtle">Issue digital purchase orders and reconcile goods incoming logs.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleOpenPOBuilder} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-1.5 h-9 font-semibold">
                <Plus className="w-4 h-4" /> Create PO Order
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Open POs</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">{dashboard?.openPOs || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Awaiting Delivery</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">{dashboard?.awaitingDelivery || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Received Today</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-success mt-1.5">{dashboard?.receivedToday || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Spend Today</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">₹{dashboard?.spendToday || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Supplier Balance</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-fg mt-1.5">₹{dashboard?.outstandingSupplierBalance || 0}</span>}
            </div>

            <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Performance Score</span>
              {isLoadingDashboard ? <Skeleton className="h-6 w-12 bg-white/5 mt-1" /> : <span className="text-xl font-extrabold text-accent mt-1.5">{dashboard?.supplierPerformanceScore || 100}%</span>}
            </div>
          </div>

          {/* Performance scorecard */}
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" /> Vendor Performance & Balance Scorecard
            </h3>
            <div className="space-y-3">
              {isLoadingDashboard ? (
                <Skeleton className="h-20 w-full bg-white/5" />
              ) : !dashboard || dashboard.supplierPerformance.length === 0 ? (
                <p className="text-xs text-fg-subtle py-4">No supplier statistics available.</p>
              ) : (
                dashboard.supplierPerformance.map((sup: any) => (
                  <div key={sup.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-fg font-semibold">{sup.name}</span>
                      <span className="text-[10px] text-fg-subtle mt-0.5">Lead Time: {sup.leadTimeDays} days | Balance: ₹{sup.outstandingBalance}</span>
                    </div>
                    <Badge className={cn("text-[10px] font-bold rounded", sup.score >= 85 ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                      Score: {sup.score}%
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PURCHASE ORDERS CATALOG */}
        <TabsContent value="purchase-orders" className="space-y-4 outline-none">
          <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
            {isLoadingPOs ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ) : pos.length === 0 ? (
              <div className="text-center py-16 text-xs text-fg-subtle">
                No Purchase Orders recorded. Open the PO Builder to issue procurement drafts.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent">
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">PO Number</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Supplier</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Order Date</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Expected Delivery</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Total Amount</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pos.map((po: PurchaseOrderRecord) => (
                      <TableRow key={po.id} className="border-white/5 hover:bg-white/[0.01]">
                        <TableCell className="py-3 font-mono font-semibold text-xs text-fg">
                          {po.poNumber}
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-xs text-fg">
                          {po.supplier.name}
                        </TableCell>
                        <TableCell className="py-3 font-mono text-xs text-fg-muted">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-3 font-mono text-xs text-fg-muted">
                          {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            className={cn(
                              "text-[9px] font-bold rounded px-1.5 py-0.5",
                              po.status === "RECEIVED"
                                ? "bg-success/15 text-success"
                                : po.status === "PARTIALLY_RECEIVED"
                                ? "bg-warning/15 text-warning"
                                : "bg-white/10 text-fg-muted"
                            )}
                          >
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-xs text-fg">
                          ₹{po.totalAmount}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                            <Button
                              onClick={() => handleOpenReceipt(po)}
                              size="sm"
                              className="bg-accent/15 hover:bg-accent/25 text-accent text-[10px] font-bold rounded h-7 px-2.5 cursor-pointer"
                            >
                              Receive Delivery
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: SUPPLIERS DIRECTORY */}
        <TabsContent value="suppliers" className="space-y-4 outline-none">
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">CRM Directory</h4>
            <div className="flex gap-2">
              <Button onClick={() => setMergeDrawerOpen(true)} size="sm" variant="secondary" className="border border-white/10 text-fg rounded-xl h-9 hover:bg-white/5 font-semibold text-xs">
                Merge Duplicates
              </Button>
              <Button onClick={handleOpenCreateSupplier} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-9 font-semibold text-xs">
                Add Supplier
              </Button>
            </div>
          </div>

          <div className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
            {isLoadingSuppliers ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-16 text-xs text-fg-subtle">
                No vendors configured. Click "Add Supplier" to initialize your procurement network.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 bg-transparent">
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Supplier</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Terms</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Lead Time</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Preferred</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Outstanding Balance</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((sup: SupplierRecord) => (
                      <TableRow key={sup.id} className="border-white/5 hover:bg-white/[0.01]">
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-fg text-sm">{sup.name}</span>
                            <span className="text-[10px] text-fg-subtle mt-0.5">{sup.email || sup.phone || "No contacts mapped"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-fg-muted">
                          {sup.paymentTerms || "N/A"}
                        </TableCell>
                        <TableCell className="py-3 font-mono text-xs text-fg-muted">
                          {sup.leadTimeDays} days
                        </TableCell>
                        <TableCell className="py-3">
                          {sup.isPreferred ? (
                            <Badge className="bg-accent/15 text-accent text-[9px] font-bold rounded px-1.5 py-0.5">Preferred</Badge>
                          ) : (
                            <span className="text-[10px] text-fg-subtle">Secondary</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono font-bold text-xs text-fg">
                          ₹{sup.outstandingBalance}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditSupplier(sup)}
                              className="text-xs hover:underline font-bold text-fg-muted hover:text-fg cursor-pointer"
                            >
                              Edit
                            </button>
                            <span className="text-white/10">|</span>
                            <button
                              onClick={() => handleArchiveSupplier(sup.id)}
                              className="text-xs hover:underline font-bold text-danger cursor-pointer"
                            >
                              Archive
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
        </TabsContent>
      </Tabs>

      {/* DRAWER: SUPPLIER CRM FORM */}
      <Sheet open={supplierDrawerOpen} onOpenChange={setSupplierDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              {activeSupplier ? "Edit Supplier profile" : "Add Supplier profile"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSupplierSubmit} className="space-y-5 p-6">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Supplier Name *</Label>
              <Input
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Phone Number</Label>
                <Input
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Email Address</Label>
                <Input
                  value={supEmail}
                  type="email"
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Office Address</Label>
              <Input
                value={supAddress}
                onChange={(e) => setSupAddress(e.target.value)}
                className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Payment Terms</Label>
                <select
                  value={supTerms}
                  onChange={(e) => setSupTerms(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                >
                  <option value="Cash On Delivery">Cash On Delivery</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Lead Time (Days)</Label>
                <Input
                  type="number"
                  value={supLeadTime}
                  onChange={(e) => setSupLeadTime(e.target.value)}
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="prefCheck"
                checked={supPreferred}
                onChange={(e) => setSupPreferred(e.target.checked)}
                className="rounded border-white/10 text-accent focus:ring-0 cursor-pointer h-4 w-4 bg-[#141416]"
              />
              <Label htmlFor="prefCheck" className="text-xs font-semibold text-fg cursor-pointer select-none">
                Designate as Preferred Supplier
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Notes / Remarks</Label>
              <textarea
                value={supNotes}
                onChange={(e) => setSupNotes(e.target.value)}
                placeholder="Product portfolios, bank details..."
                className="w-full min-h-[70px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setSupplierDrawerOpen(false)} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={saveSupplierMutation.isPending}>
                Save Supplier
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* DRAWER: MERGE DUPLICATES */}
      <Sheet open={mergeDrawerOpen} onOpenChange={setMergeDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md border-l border-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Merge Duplicate Vendors
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleMergeSubmit} className="space-y-5 p-6">
            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl text-xs text-warning space-y-1">
              <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4 shrink-0" /> Merging Policy Warning:</span>
              <p className="leading-relaxed">This action transfers all Purchase Orders and active ingredients from the source supplier to the target supplier, aggregates outstanding balances, and archives the source supplier. This cannot be undone.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Duplicate Source Supplier * (will be archived)</Label>
              <select
                value={mergeSourceId}
                onChange={(e) => setMergeSourceId(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                required
              >
                <option value="">Select source vendor...</option>
                {suppliers.map((s: SupplierRecord) => (
                  <option key={s.id} value={s.id}>{s.name} (Balance: ₹{s.outstandingBalance})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Primary Target Supplier * (will absorb source items)</Label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                required
              >
                <option value="">Select target vendor...</option>
                {suppliers.map((s: SupplierRecord) => (
                  <option key={s.id} value={s.id}>{s.name} (Balance: ₹{s.outstandingBalance})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setMergeDrawerOpen(false)} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={mergeSuppliersMutation.isPending}>
                Merge Vendors
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* DRAWER: PURCHASE ORDER BUILDER */}
      <Sheet open={poDrawerOpen} onOpenChange={setPoDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent" />
              PO Procurement Builder
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handlePOSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Target Supplier *</Label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
                  required
                >
                  {suppliers.map((s: SupplierRecord) => (
                    <option key={s.id} value={s.id}>{s.name} (Terms: {s.paymentTerms})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={poDeliveryDate}
                  onChange={(e) => setPoDeliveryDate(e.target.value)}
                  className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Ingredients builder items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                <span>PO Line Items</span>
                <button type="button" onClick={addPOItemRow} className="text-accent hover:text-accent-foreground text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                  <PlusCircle className="w-3.5 h-3.5" /> Add Line
                </button>
              </div>

              <div className="space-y-3">
                {poItems.map((row, idx) => (
                  <div key={idx} className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-3 relative">
                    <div className="absolute right-2 top-2">
                      {poItems.length > 1 && (
                        <button type="button" onClick={() => removePOItemRow(idx)} className="text-fg-subtle hover:text-danger">
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-fg-muted">Ingredient *</Label>
                        <select
                          value={row.ingredientId}
                          onChange={(e) => {
                            const list = [...poItems];
                            list[idx].ingredientId = e.target.value;
                            setPoItems(list);
                          }}
                          className="w-full h-9 px-2 text-xs bg-[#141416] border border-white/10 rounded-lg text-fg"
                          required
                        >
                          {rawIngredients.map((ing: InventoryItem) => (
                            <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-fg-muted">Ordered Qty *</Label>
                        <Input
                          type="number"
                          value={row.orderedQty}
                          onChange={(e) => {
                            const list = [...poItems];
                            list[idx].orderedQty = e.target.value;
                            setPoItems(list);
                          }}
                          className="bg-[#141416] border-white/10 h-9 text-xs rounded-lg font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-fg-muted">Unit Cost *</Label>
                        <Input
                          type="number"
                          value={row.unitCost}
                          onChange={(e) => {
                            const list = [...poItems];
                            list[idx].unitCost = e.target.value;
                            setPoItems(list);
                          }}
                          className="bg-[#141416] border-white/10 h-9 text-xs rounded-lg font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-fg-muted">Discount (₹)</Label>
                        <Input
                          type="number"
                          value={row.discountAmount}
                          onChange={(e) => {
                            const list = [...poItems];
                            list[idx].discountAmount = e.target.value;
                            setPoItems(list);
                          }}
                          className="bg-[#141416] border-white/10 h-9 text-xs rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Remarks / Order notes</Label>
              <textarea
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                placeholder="Include delivery instructions, target loading bay..."
                className="w-full min-h-[70px] p-3 text-xs bg-[#141416] border border-white/10 rounded-xl text-fg outline-none"
              />
            </div>

            {/* Calculations summaries */}
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-fg-subtle">Subtotal:</span>
                <span className="font-mono text-fg">₹{poLiveCalculations.subTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-subtle">Est Tax (5%):</span>
                <span className="font-mono text-fg">₹{poLiveCalculations.tax}</span>
              </div>
              <div className="flex justify-between text-accent font-bold pt-2 border-t border-white/5">
                <span>Grand Total:</span>
                <span className="font-mono text-sm">₹{poLiveCalculations.grandTotal}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setPoDrawerOpen(false)} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={createPOMutation.isPending}>
                Send Purchase Order
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* DRAWER: GOODS RECEIPT RECONCILIATION SHEET */}
      <Sheet open={receiptDrawerOpen} onOpenChange={setReceiptDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto border-l border-white/5 bg-[#0F0F10] text-fg p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-fg font-semibold flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-accent" />
              Goods Receipt & Reconciliation
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleReceiptSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-3 text-xs border-b border-white/5 pb-4">
              <div>
                <span className="text-fg-subtle block">Reconciling PO</span>
                <span className="font-mono font-bold text-fg mt-0.5 text-sm">{activePO?.poNumber}</span>
              </div>
              <div>
                <span className="text-fg-subtle block">Supplier</span>
                <span className="font-bold text-fg mt-0.5 text-sm">{activePO?.supplier.name}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Vendor Invoice / Challan Number</Label>
              <Input
                value={recInvoiceNumber}
                onChange={(e) => setRecInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-9902"
                className="bg-[#141416] border-white/10 h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Reconciliation table mapping */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent border-b border-white/5 pb-1">
                Line Items Reconciliation
              </div>

              <div className="space-y-4">
                {recItems.map((item, idx) => {
                  const variance = parseFloat(item.receivedQty) - item.orderedQty;
                  return (
                    <div key={idx} className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-3 relative">
                      <div className="flex justify-between items-center text-xs font-semibold text-fg">
                        <span>{item.name}</span>
                        <span className="text-fg-subtle font-normal">Ordered: {item.orderedQty}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-fg-muted">Received Qty</Label>
                          <Input
                            type="number"
                            value={item.receivedQty}
                            onChange={(e) => {
                              const list = [...recItems];
                              list[idx].receivedQty = e.target.value;
                              setRecItems(list);
                            }}
                            className="bg-[#141416] border-white/10 h-8 text-[11px] rounded font-mono"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-fg-muted">Damaged Qty</Label>
                          <Input
                            type="number"
                            value={item.damagedQty}
                            onChange={(e) => {
                              const list = [...recItems];
                              list[idx].damagedQty = e.target.value;
                              setRecItems(list);
                            }}
                            className="bg-[#141416] border-white/10 h-8 text-[11px] rounded font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-fg-muted">Rejected Qty</Label>
                          <Input
                            type="number"
                            value={item.rejectedQty}
                            onChange={(e) => {
                              const list = [...recItems];
                              list[idx].rejectedQty = e.target.value;
                              setRecItems(list);
                            }}
                            className="bg-[#141416] border-white/10 h-8 text-[11px] rounded font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-fg-muted">Actual Cost (₹)</Label>
                          <Input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => {
                              const list = [...recItems];
                              list[idx].unitCost = e.target.value;
                              setRecItems(list);
                            }}
                            className="bg-[#141416] border-white/10 h-8 text-[11px] rounded font-mono"
                            required
                          />
                        </div>

                        <div className="flex items-end justify-end pb-1.5">
                          {variance !== 0 && (
                            <span className={cn("text-[9px] font-bold flex items-center gap-0.5", variance > 0 ? "text-success" : "text-danger")}>
                              <AlertTriangle className="w-3 h-3 shrink-0" /> Variance: {variance > 0 ? `+${variance}` : variance}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={() => setReceiptDrawerOpen(false)} className="border-white/10 hover:bg-white/5 text-fg rounded-xl h-10 px-4">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-10 px-4" disabled={receiveGoodsMutation.isPending}>
                Approve Goods Receipt
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
