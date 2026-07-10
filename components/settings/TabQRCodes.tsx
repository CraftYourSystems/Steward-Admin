"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  Plus, Edit2, AlertTriangle, Loader2, Info, MapPin, X, Copy, Download, Printer, Check, Link2, ExternalLink
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsShell, SettingsSection } from "./SettingsShell";
import type { ApiSuccess, QrCode } from "@/types";
import { MENU_URL } from "@/lib/config/env";

const QR_PURPOSE_TEMPLATES = [
  "Main Counter",
  "Pickup Counter",
  "Entrance",
  "Table 1",
  "Table 2",
];

export function TabQRCodes() {
  const queryClient = useQueryClient();
  const { currentBranch, restaurant } = useAuth();

  // Modal / Interaction States
  const [createOpen, setCreateOpen] = useState(false);
  const [editQr, setEditQr] = useState<QrCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printPreviewQr, setPrintPreviewQr] = useState<QrCode | null>(null);

  // Form Field States
  const [name, setName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Query: Load QR Codes ──────────────────────────────────────────────────
  const { data: qrCodes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["qr-codes-list", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      const { data } = await api.get<ApiSuccess<QrCode[]>>(`/branches/${currentBranch.id}/qr-codes`);
      return data.data || [];
    },
    enabled: !!currentBranch?.id,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Create QR Code
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; tableNumber?: string }) => {
      const { data } = await api.post(`/branches/${currentBranch?.id}/qr-codes`, payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success("QR Code generated successfully.");
      setCreateOpen(false);
      setName("");
      setTableNumber("");
      setFormError(null);
      refetch();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? err?.response?.data?.error?.message ?? "Failed to create QR code");
    }
  });

  // Edit QR Code
  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; tableNumber: string | null }) => {
      const { data } = await api.patch(`/branches/${currentBranch?.id}/qr-codes/${payload.id}`, {
        name: payload.name,
        tableNumber: payload.tableNumber || null,
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success("QR Code updated successfully.");
      setEditQr(null);
      setName("");
      setTableNumber("");
      setFormError(null);
      refetch();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? err?.response?.data?.error?.message ?? "Failed to update QR code");
    }
  });

  // Toggle QR Code Status (Activate / Deactivate)
  const toggleMutation = useMutation({
    mutationFn: async (payload: { id: string; isActive: boolean }) => {
      const endpoint = payload.isActive ? "activate" : "deactivate";
      await api.post(`/branches/${currentBranch?.id}/qr-codes/${payload.id}/${endpoint}`);
    },
    onSuccess: (_, variables) => {
      toast.success(`QR Code ${variables.isActive ? "activated" : "deactivated"} successfully.`);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to toggle status");
    }
  });

  // ─── Event & Action Handlers ───────────────────────────────────────────────

  const handleOpenCreate = () => {
    setName("");
    setTableNumber("");
    setFormError(null);
    setCreateOpen(true);
  };

  const handleOpenEdit = (qr: QrCode) => {
    setName(qr.name || "");
    setTableNumber(qr.tableNumber || "");
    setFormError(null);
    setEditQr(qr);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Name/Purpose is required");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      tableNumber: tableNumber.trim() ? tableNumber.trim() : undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQr) return;
    if (!name.trim()) {
      setFormError("Name/Purpose is required");
      return;
    }
    editMutation.mutate({
      id: editQr.id,
      name: name.trim(),
      tableNumber: tableNumber.trim() || null,
    });
  };

  const getFullPublicUrl = (code: string) => {
    const base = MENU_URL.replace(/\/$/, "");
    return `${base}/qr/${code}`;
  };

  const handleCopyLink = async (qr: QrCode) => {
    const url = getFullPublicUrl(qr.code);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedId(qr.id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download QR Code as PNG
  const downloadPng = (qr: QrCode) => {
    const canvas = document.getElementById(`qr-canvas-${qr.id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${qr.name?.toLowerCase().replace(/\s+/g, "-") || "qr"}-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download QR Code as SVG
  const downloadSvg = (qr: QrCode) => {
    const svg = document.getElementById(`qr-svg-${qr.id}`);
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${qr.name?.toLowerCase().replace(/\s+/g, "-") || "qr"}-code.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print Action
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <SettingsShell
        title="QR Codes"
        description="Generate, label, and manage customer-facing QR codes scoped to this active branch. Supports direct counter ordering and tables."
        actions={
          <Button onClick={handleOpenCreate} size="sm" className="flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Create QR Code
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <p className="text-[13px] text-fg-subtle">Failed to load QR codes.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center rounded-xl border border-border bg-surface">
            <div className="h-10 w-10 rounded-lg border border-border bg-surface-2 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-semibold text-fg">No QR codes generated</p>
            <p className="text-[11px] text-fg-subtle max-w-[260px]">Create QR codes for counters, pick-up stations, or tables to allow clients to self-order.</p>
          </div>
        ) : (
          <SettingsSection className="divide-y divide-border/30 px-0">
            {qrCodes.map((qr: QrCode) => {
              const publicUrl = getFullPublicUrl(qr.code);
              return (
                <div key={qr.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-white/[0.01] transition-colors gap-4">
                  
                  {/* Left Column: Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-fg truncate">{qr.name}</span>
                      {qr.tableNumber && (
                        <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/5 px-1.5 py-0.5 text-[9px] font-bold text-fg-muted uppercase tracking-wider">
                          Table {qr.tableNumber}
                        </span>
                      )}
                      {qr.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-fg-subtle">
                      <span className="truncate max-w-[280px]" title={publicUrl}>{publicUrl}</span>
                      <button
                        onClick={() => handleCopyLink(qr)}
                        className="text-fg-muted hover:text-fg transition-colors"
                        title="Copy customer menu URL"
                      >
                        {copiedId === qr.id ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <a href={publicUrl} target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg transition-colors">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Actions & Rendering */}
                  <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                    {/* Hidden renders for client-side download exports */}
                    <div className="hidden">
                      <QRCodeCanvas
                        id={`qr-canvas-${qr.id}`}
                        value={publicUrl}
                        size={256}
                        level="H"
                        includeMargin
                      />
                      <QRCodeSVG
                        id={`qr-svg-${qr.id}`}
                        value={publicUrl}
                        size={256}
                        level="H"
                        includeMargin
                      />
                    </div>

                    {/* Miniature Preview Box */}
                    <div className="bg-white p-1 rounded border border-border/10 shrink-0">
                      <QRCodeCanvas value={publicUrl} size={40} level="M" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(qr)}
                        title="Edit label"
                        className="h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors border border-border"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setPrintPreviewQr(qr)}
                        title="Print A4 sheet"
                        className="h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors border border-border"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {/* Downloads */}
                      <button
                        onClick={() => downloadPng(qr)}
                        title="Download PNG image"
                        className="h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors border border-border"
                      >
                        <span className="text-[9px] font-bold">PNG</span>
                      </button>

                      <button
                        onClick={() => downloadSvg(qr)}
                        title="Download SVG vector"
                        className="h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors border border-border"
                      >
                        <span className="text-[9px] font-bold">SVG</span>
                      </button>

                      {qr.isActive ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleMutation.mutate({ id: qr.id, isActive: false })}
                          className="text-danger hover:bg-danger/10 hover:text-danger cursor-pointer ml-1"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleMutation.mutate({ id: qr.id, isActive: true })}
                          className="text-success hover:bg-success/10 hover:text-success cursor-pointer ml-1"
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </SettingsSection>
        )}
      </SettingsShell>

      {/* ── Create QR Code Modal ── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-fg">Create QR Code</h3>
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
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Purpose Name / Label *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Entrance, Main Counter, Table 4"
                  required
                />
                
                {/* Templates Helper */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QR_PURPOSE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => setName(tmpl)}
                      className="text-[10px] px-2 py-0.5 rounded border border-border bg-surface-2 hover:bg-surface-3 text-fg-muted hover:text-fg transition-colors"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Table Number (Optional)</label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 5 (Leave empty if Counter/Entrance)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Generating..." : "Generate Code"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit QR Code Modal ── */}
      {editQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in-0 scale-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-fg">Edit QR details</h3>
              <button onClick={() => setEditQr(null)} className="text-fg-subtle hover:text-fg transition-colors">
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
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Purpose Name / Label *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Entrance, Main Counter"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Table Number (Optional)</label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditQr(null)} disabled={editMutation.isPending}>
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

      {/* ── Print Preview Modal (A4 layout overlay) ── */}
      {printPreviewQr && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-[4px] p-4">
          {/* Print specific CSS override injected locally */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #a4-print-sheet, #a4-print-sheet * {
                visibility: visible !important;
              }
              #a4-print-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: black !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
              }
            }
          `}</style>
          
          <div className="w-full max-w-[550px] rounded-xl border border-border bg-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="text-[14px] font-semibold text-fg">Print Sheet Preview (A4 Layout)</h3>
              <button onClick={() => setPrintPreviewQr(null)} className="text-fg-subtle hover:text-fg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* A4 Sheet Container Preview (matches A4 aspect ratio 1 : 1.414 or centering card) */}
            <div className="flex justify-center p-4 bg-white rounded-lg border border-border/20 mb-6">
              <div
                id="a4-print-sheet"
                className="w-full max-w-[360px] bg-white text-black p-8 flex flex-col items-center justify-center text-center rounded shadow-sm border border-neutral-200"
              >
                {/* Restaurant Brand */}
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
                  {restaurant?.name || "Steward Restaurant"}
                </h1>
                
                {/* Branch Info */}
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mt-1">
                  {currentBranch?.name || "Main Branch"}
                </p>

                {/* QR Box Container */}
                <div className="my-8 p-6 bg-white rounded-2xl border-4 border-neutral-900 shadow-md">
                  <QRCodeCanvas
                    value={getFullPublicUrl(printPreviewQr.code)}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                {/* Purpose Title */}
                <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wider">
                  {printPreviewQr.name}
                </h2>
                
                {printPreviewQr.tableNumber && (
                  <p className="text-2xl font-extrabold text-neutral-900 mt-1">
                    TABLE {printPreviewQr.tableNumber}
                  </p>
                )}

                <div className="h-0.5 w-16 bg-neutral-300 my-4" />

                {/* Instructions */}
                <p className="text-xs font-medium text-neutral-600 max-w-[200px] leading-relaxed">
                  Scan this QR code using your smartphone camera to view menu, choose items, and order.
                </p>

                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-6">
                  Powered by Steward Ordering
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPrintPreviewQr(null)}>
                Close Preview
              </Button>
              <Button onClick={triggerPrint} className="flex items-center gap-1.5">
                <Printer className="h-4 w-4" />
                Print A4 Sheet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
