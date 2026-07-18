"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  RefreshCw,
  Pencil,
  Users,
  Loader2,
  Copy,
  Check,
  ClipboardList,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, cn } from "@/lib/utils";
import type { ApiSuccess, PaginationMeta, User } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember extends User {
  isActive: boolean;
  createdAt: string;
}

interface StaffResponse {
  data: StaffMember[];
  meta: PaginationMeta;
}

interface CreateStaffResponse extends StaffMember {
  temporaryPin: string; // 4-digit PIN for staff tablet login
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  phone: z.string().optional(),
  role: z.enum(["KITCHEN_STAFF", "WAITER"], {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

const editSchema = z.object({
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  phone: z.string().optional(),
  role: z.enum(["KITCHEN_STAFF", "WAITER", "ADMIN"]),
  isActive: z.boolean(),
});

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["KITCHEN_STAFF", "WAITER"], { errorMap: () => ({ message: "Role required" }) }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;
type InviteForm = z.infer<typeof inviteSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  KITCHEN_STAFF: "Kitchen Staff",
  WAITER: "Waiter",
};

type BadgeVariant = "default" | "neutral" | "warning" | "info" | "success";

const ROLE_VARIANT: Record<string, BadgeVariant> = {
  SUPER_ADMIN: "default",
  ADMIN: "success",
  KITCHEN_STAFF: "warning",
  WAITER: "info",
};

const ROLE_DESCRIPTIONS: Record<string, { desc: string; permissions: string[] }> = {
  ADMIN: {
    desc: "Full operational access and administrative control.",
    permissions: [
      "Access to all settings & branch configs",
      "Manage staff accounts & reset PINs",
      "Full menu catalog creation & editing",
      "View revenue, orders, & business performance reports",
    ],
  },
  KITCHEN_STAFF: {
    desc: "Optimized for kitchen operations and order processing.",
    permissions: [
      "Access to KDS (Kitchen Display System) queue",
      "Update order status (Preparing, Ready)",
      "Manage real-time item availability (on/off)",
      "Read-only access to historical orders",
    ],
  },
  WAITER: {
    desc: "Designed for table-side service and order placement.",
    permissions: [
      "Create new orders for tables",
      "View live active order statuses",
      "Request bill printing & update payment details",
    ],
  },
};

// ─── Create Sheet ─────────────────────────────────────────────────────────────

function CreateStaffSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [createMode, setCreateMode] = useState("invite");
  const [tempPin, setTempPin] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<{
    email: string;
    restaurantName: string;
    restaurantCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Password creation form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  // Invite form
  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    setValue: setInviteValue,
    reset: resetInvite,
    watch: watchInvite,
    formState: { errors: inviteErrors, isSubmitting: inviteSubmitting },
  } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });

  const activeRole = watch("role");
  const activeInviteRole = watchInvite("role");

  const handleClose = () => {
    reset();
    resetInvite();
    setTempPin(null);
    setInviteSuccess(null);
    setCopied(false);
    setCreateMode("invite");
    onOpenChange(false);
  };

  const onSubmit = async (values: CreateForm) => {
    try {
      const { data } = await api.post<ApiSuccess<CreateStaffResponse>>(
        "/admin/staff",
        values
      );
      setTempPin(data.data.temporaryPin);
      toast.success(`${values.firstName} ${values.lastName} added to staff`);
      onCreated();
      reset();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Failed to create staff member";
      toast.error(message);
    }
  };

  const handleInviteSubmitForm = handleInviteSubmit(async (values) => {
    try {
      const result = await api.post("/admin/staff/invite", values);
      setInviteSuccess(result.data.data);
      resetInvite();
      toast.success("Invite sent!");
      onCreated();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Failed to send invite";
      toast.error(message);
    }
  });

  const copyPin = () => {
    if (!tempPin) return;
    navigator.clipboard.writeText(tempPin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10]">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-fg font-semibold">Invite Staff Member</SheetTitle>
        </SheetHeader>

        {/* Tab toggle */}
        <div className="flex gap-2 mb-5 bg-white/5 p-1 rounded-lg border border-white/5">
          {(["invite", "password"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setCreateMode(mode);
                setInviteSuccess(null);
              }}
              className={cn(
                "flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition-all duration-150",
                createMode === mode ? "bg-white/10 text-fg" : "text-fg-muted hover:text-fg"
              )}
            >
              {mode === "invite" ? "Invite via Google" : "Direct PIN Account"}
            </button>
          ))}
        </div>

        {createMode === "invite" ? (
          // Invite form
          inviteSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-3">
                <p className="text-[13px] font-semibold text-fg">
                  Account created for <strong>{inviteSuccess?.email}</strong>
                </p>
                <p className="text-[12px] text-fg-muted">Share these details with them so they can sign in:</p>
                <div className="rounded-md border border-white/10 bg-[#1a1a1c] px-3 py-2.5 space-y-1">
                  <p className="text-[10px] text-fg-subtle uppercase tracking-wide font-medium">Restaurant code</p>
                  <p className="text-[18px] font-bold font-mono tracking-widest text-fg">
                    {inviteSuccess?.restaurantCode}
                  </p>
                </div>
                <p className="text-[11px] text-fg-subtle">
                  They sign in at <strong>steward.app/login</strong> → Staff tab → enter this code + their Google account.
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setInviteSuccess(null)}>
                  Add Another
                </Button>
                <Button variant="secondary" className="flex-1" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInviteSubmitForm} className="space-y-5 text-fg">
              <div className="space-y-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                  Gmail Invitation Details
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Email Address *</Label>
                  <Input
                    type="email"
                    {...registerInvite("email")}
                    placeholder="staff@gmail.com"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                  {inviteErrors.email && <p className="text-[11px] text-danger">{inviteErrors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Role Assignment *</Label>
                  <Select onValueChange={(v) => setInviteValue("role", v as InviteForm["role"])}>
                    <SelectTrigger className="bg-[#1a1a1c] border-white/10 h-10 text-[12px] text-fg">
                      <SelectValue placeholder="Select role…" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
                      <SelectItem value="KITCHEN_STAFF" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Kitchen Staff</SelectItem>
                      <SelectItem value="WAITER" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Waiter</SelectItem>
                    </SelectContent>
                  </Select>
                  {inviteErrors.role && <p className="text-[11px] text-danger">{inviteErrors.role.message}</p>}
                </div>

                {/* Role Description Card */}
                {activeInviteRole && ROLE_DESCRIPTIONS[activeInviteRole] && (
                  <div className="rounded-lg border border-white/5 bg-[#161618] p-3 text-[11px] space-y-1.5 mt-2.5">
                    <span className="font-semibold text-fg-subtle text-[10px] uppercase tracking-wider block">
                      Role Access Summary: {ROLE_LABELS[activeInviteRole]}
                    </span>
                    <p className="text-fg-muted leading-relaxed font-normal italic">
                      {ROLE_DESCRIPTIONS[activeInviteRole].desc}
                    </p>
                    <ul className="space-y-1 mt-1 text-fg-subtle list-disc pl-4 font-normal">
                      {ROLE_DESCRIPTIONS[activeInviteRole].permissions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                  Optional Profile Info
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-fg-muted">First Name</Label>
                    <Input
                      {...registerInvite("firstName")}
                      placeholder="Jane"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-fg-muted">Last Name</Label>
                    <Input
                      {...registerInvite("lastName")}
                      placeholder="Doe"
                      className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
                <Button type="button" variant="outline" onClick={handleClose} className="border-white/10 hover:bg-white/5 text-fg">
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteSubmitting} className="bg-accent hover:bg-accent/90 text-white">
                  {inviteSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Send Invitation
                </Button>
              </div>
            </form>
          )
        ) : // Password creation form
        tempPin ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-2">
              <p className="text-[13px] font-semibold text-fg">Account created</p>
              <p className="text-[12px] text-fg-muted">
                Share this 4-digit PIN with the staff member. They enter it on the Staff login tab along with the
                restaurant code to clock in. It will not be shown again.
              </p>
              <div className="flex items-center gap-2 mt-2 rounded-md border border-white/10 bg-[#1a1a1c] px-3 py-2">
                <code className="flex-1 text-[16px] font-mono font-bold text-fg select-all">{tempPin}</code>
                <button
                  onClick={copyPin}
                  className="flex-shrink-0 text-fg-muted hover:text-fg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setTempPin(null)}>
                Add Another
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-fg">
            <div className="space-y-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                Personal Information
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">First Name *</Label>
                  <Input
                    {...register("firstName")}
                    placeholder="Jane"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                  {errors.firstName && <p className="text-[11px] text-danger">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-fg-muted">Last Name *</Label>
                  <Input
                    {...register("lastName")}
                    placeholder="Doe"
                    className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                  />
                  {errors.lastName && <p className="text-[11px] text-danger">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Email Address *</Label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="jane@restaurant.com"
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                />
                {errors.email && <p className="text-[11px] text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Phone</Label>
                <Input
                  {...register("phone")}
                  placeholder="+91 98765 43210"
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                />
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
                Employment & Role
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Role Assignment *</Label>
                <Select onValueChange={(v) => setValue("role", v as CreateForm["role"])}>
                  <SelectTrigger className="bg-[#1a1a1c] border-white/10 h-10 text-[12px] text-fg">
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
                    <SelectItem value="KITCHEN_STAFF" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Kitchen Staff</SelectItem>
                    <SelectItem value="WAITER" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Waiter</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-[11px] text-danger">{errors.role.message}</p>}
              </div>

              {/* Role Description Card */}
              {activeRole && ROLE_DESCRIPTIONS[activeRole] && (
                <div className="rounded-lg border border-white/5 bg-[#161618] p-3 text-[11px] space-y-1.5">
                  <span className="font-semibold text-fg-subtle text-[10px] uppercase tracking-wider block">
                    Role Access Summary: {ROLE_LABELS[activeRole]}
                  </span>
                  <p className="text-fg-muted leading-relaxed font-normal italic">{ROLE_DESCRIPTIONS[activeRole].desc}</p>
                  <ul className="space-y-1 mt-1 text-fg-subtle list-disc pl-4 font-normal">
                    {ROLE_DESCRIPTIONS[activeRole].permissions.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2.5 text-[11px] text-fg-subtle font-normal">
              A random 4-digit PIN will be generated. Share it with the staff member so they can clock in.
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outline" onClick={handleClose} className="border-white/10 hover:bg-white/5 text-fg">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-white">
                {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

function EditStaffSheet({
  member,
  open,
  onOpenChange,
  onUpdated,
}: {
  member: StaffMember | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: member
      ? {
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone ?? "",
          role: member.role as EditForm["role"],
          isActive: member.isActive,
        }
      : undefined,
  });

  const activeRole = watch("role");

  const [resetPinResult, setResetPinResult] = React.useState<string | null>(null);
  const [resetPinLoading, setResetPinLoading] = React.useState(false);
  const [pinCopied, setPinCopied] = React.useState(false);

  const handleClose = () => {
    reset();
    setResetPinResult(null);
    onOpenChange(false);
  };

  const handleResetPin = async () => {
    if (!member) return;
    setResetPinLoading(true);
    try {
      const { data } = await api.post<ApiSuccess<{ temporaryPin: string }>>(
        `/admin/staff/${member.id}/reset-pin`
      );
      setResetPinResult(data.data.temporaryPin);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to reset PIN");
    } finally {
      setResetPinLoading(false);
    }
  };

  const onSubmit = async (values: EditForm) => {
    if (!member) return;
    try {
      await api.patch(`/admin/staff/${member.id}`, values);
      toast.success("Staff member updated");
      onUpdated();
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update staff member");
    }
  };

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10]">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-fg font-semibold">Edit Staff Profile</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-fg">
          {/* Personal Info */}
          <div className="space-y-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
              Personal Information
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">First Name *</Label>
                <Input
                  {...register("firstName")}
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                />
                {errors.firstName && <p className="text-[11px] text-danger">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-fg-muted">Last Name *</Label>
                <Input
                  {...register("lastName")}
                  className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
                />
                {errors.lastName && <p className="text-[11px] text-danger">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Email Address</Label>
              <Input
                value={member.email}
                disabled
                className="opacity-50 cursor-not-allowed bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
              />
              <p className="text-[10px] text-fg-subtle italic">Email cannot be modified</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Phone Number</Label>
              <Input
                {...register("phone")}
                placeholder="+91 98765 43210"
                className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
              />
            </div>
          </div>

          {/* Role & Status */}
          <div className="space-y-3.5 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
              Employment Details
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Role Assignment</Label>
              <Select defaultValue={member.role} onValueChange={(v) => setValue("role", v as EditForm["role"])}>
                <SelectTrigger className="bg-[#1a1a1c] border-white/10 h-10 text-[12px] text-fg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
                  <SelectItem value="KITCHEN_STAFF" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Kitchen Staff</SelectItem>
                  <SelectItem value="WAITER" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Waiter</SelectItem>
                  <SelectItem value="ADMIN" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Summary Indicator Card */}
            {activeRole && ROLE_DESCRIPTIONS[activeRole] && (
              <div className="rounded-lg border border-white/5 bg-[#161618] p-3 text-[11px] space-y-1.5 mt-2.5">
                <span className="font-semibold text-fg-subtle text-[10px] uppercase tracking-wider block">
                  Role Access Summary: {ROLE_LABELS[activeRole]}
                </span>
                <p className="text-fg-muted leading-relaxed font-normal italic">{ROLE_DESCRIPTIONS[activeRole].desc}</p>
                <ul className="space-y-1 mt-1 text-fg-subtle list-disc pl-4 font-normal">
                  {ROLE_DESCRIPTIONS[activeRole].permissions.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Account Status</Label>
              <Select
                defaultValue={member.isActive ? "true" : "false"}
                onValueChange={(v) => setValue("isActive", v === "true")}
              >
                <SelectTrigger className="bg-[#1a1a1c] border-white/10 h-10 text-[12px] text-fg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
                  <SelectItem value="true" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Active</SelectItem>
                  <SelectItem value="false" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset PIN Card */}
          <div className="rounded-lg border border-white/5 bg-[#161618] p-3 space-y-2.5 pt-3">
            <span className="text-[11px] font-semibold text-fg uppercase tracking-wider block">Staff PIN Management</span>
            {resetPinResult ? (
              <div className="space-y-2">
                <p className="text-[11px] text-fg-muted">New PIN generated. Share it with the staff member:</p>
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#1a1a1c] px-3 py-2">
                  <code className="flex-1 text-[16px] font-bold font-mono tracking-widest text-fg select-all">
                    {resetPinResult}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetPinResult!).then(() => {
                        setPinCopied(true);
                        setTimeout(() => setPinCopied(false), 2000);
                      });
                    }}
                    className="text-fg-muted hover:text-fg transition-colors"
                  >
                    {pinCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                className="w-full h-9 bg-white/5 border border-white/10 text-[11px] text-fg hover:bg-white/10 transition-colors"
                onClick={handleResetPin}
                disabled={resetPinLoading}
              >
                {resetPinLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Reset Staff PIN
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="border-white/10 hover:bg-white/5 text-fg">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-white">
              {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nameAsc");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["staff", page],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<StaffMember[]> & { meta: PaginationMeta }>(
        "/admin/staff",
        { params: { page, limit: 50 } } // Increased limit to 50 for client-side search breadth
      );
      return data as unknown as StaffResponse;
    },
  });

  const staff: StaffMember[] = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  // Calculate Overview Ribbon metrics
  const totalCount = staff.length;
  const activeCount = staff.filter((s) => s.isActive).length;
  const inactiveCount = staff.filter((s) => !s.isActive).length;
  const managersCount = staff.filter((s) => s.role === "ADMIN" || s.role === "SUPER_ADMIN").length;
  const kitchenCount = staff.filter((s) => s.role === "KITCHEN_STAFF").length;
  const waitersCount = staff.filter((s) => s.role === "WAITER").length;

  const hasActiveFilters = !!(search || roleFilter !== "all" || statusFilter !== "all" || sortBy !== "nameAsc");

  // Client side filtering
  const filteredStaff = staff.filter((member) => {
    const term = search.toLowerCase();
    const matchesSearch =
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term) ||
      (member.phone || "").toLowerCase().includes(term);

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" ? member.isActive : !member.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Client side sorting
  const sortedStaff = [...filteredStaff].sort((a, b) => {
    if (sortBy === "nameDesc") {
      return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
    }
    if (sortBy === "role") {
      return a.role.localeCompare(b.role);
    }
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
  });

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1 gap-4 border-b border-white/5">
        <div>
          <div className="label-xs mb-1">Administration</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Staff</h2>
          <p className="text-[12px] text-fg-subtle mt-1 num">
            {meta
              ? `${meta.total.toLocaleString()} member${meta.total !== 1 ? "s" : ""} · Page ${meta.page} of ${meta.totalPages}`
              : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 bg-white/5 hover:bg-white/10 border-white/10 text-fg"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["staff"] })}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5 bg-accent hover:bg-accent/90 text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Invite Staff
          </Button>
        </div>
      </div>

      {/* Team Overview Ribbon */}
      {!isLoading && staff.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: "Total Staff", count: totalCount, color: "text-fg bg-white/5 border-white/10" },
            { label: "Active", count: activeCount, color: "text-success bg-success/10 border-success/20" },
            { label: "Managers", count: managersCount, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
            { label: "Kitchen Staff", count: kitchenCount, color: "text-warning bg-warning/10 border-warning/20" },
            { label: "Waiters", count: waitersCount, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
            { label: "Inactive", count: inactiveCount, color: "text-danger bg-danger/10 border-danger/20" },
          ].map((stat) => (
            <div key={stat.label} className={cn("flex flex-col gap-1 p-3 rounded-xl border transition-all", stat.color)}>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">{stat.label}</span>
              <span className="text-xl font-bold tracking-tight num">{stat.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Unified Search & Filters Toolbar */}
      {!isLoading && staff.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
            <input
              type="text"
              placeholder="Search staff by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="KITCHEN_STAFF">Kitchen Staff</option>
              <option value="WAITER">Waiter</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 text-[12px] bg-[#1a1a1c] border border-white/10 rounded-lg text-fg-muted outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="nameAsc">Name (A-Z)</option>
              <option value="nameDesc">Name (Z-A)</option>
              <option value="role">Role Type</option>
              <option value="newest">Newest Joined</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-[11px] px-2.5 hover:bg-white/5 text-fg-subtle hover:text-fg"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setSortBy("nameAsc");
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-premium overflow-hidden border border-white/5 rounded-xl bg-white/[0.01]">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-fg-muted">Failed to load staff.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <Users className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No staff members yet</p>
            <p className="text-[11px] text-fg-subtle font-normal">
              Invite your first employee to start assigning operational roles.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 mt-2 bg-accent hover:bg-accent/90 text-white">
              <Plus className="h-3.5 w-3.5" /> Invite Staff
            </Button>
          </div>
        ) : sortedStaff.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center animate-fade-in">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <Search className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No matching staff members</p>
            <p className="text-[11px] text-fg-subtle font-normal">Try adjusting your search query or filters.</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
                setSortBy("nameAsc");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Name
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Email
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Role
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Status
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Last Login
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Joined
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStaff.map((member: StaffMember) => (
                  <TableRow
                    key={member.id}
                    className="border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-3">
                        {/* Circle Initials Avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-fg-subtle uppercase select-none shrink-0">
                          {member.firstName ? member.firstName[0] : ""}
                          {member.lastName ? member.lastName[0] : ""}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-fg">
                            {member.firstName} {member.lastName}
                          </p>
                          {member.phone && (
                            <p className="text-[11px] text-fg-subtle font-normal mt-0.5">{member.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-fg-muted font-normal">
                      {member.email}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant={ROLE_VARIANT[member.role] ?? "neutral"} className="text-[10px] font-semibold px-2 py-0.5">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      {member.isActive ? (
                        <Badge variant="success" className="text-[10px] font-semibold px-2 py-0.5">Active</Badge>
                      ) : (
                        <Badge variant="neutral" className="text-[10px] font-semibold px-2 py-0.5">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-[11px] text-fg-subtle num">
                      {member.lastLoginAt ? formatDate(member.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell className="py-2.5 text-[11px] text-fg-subtle num">
                      {member.createdAt ? formatDate(member.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/audit?actorId=${member.id}&actorEmail=${encodeURIComponent(member.email)}`}
                          title="View activity"
                          className="inline-grid h-7 w-7 place-items-center rounded-md border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditMember(member)}
                          className="inline-grid h-7 w-7 place-items-center rounded-md border border-white/10 text-fg-muted hover:bg-white/10 hover:text-fg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5 bg-white/[0.01]">
            <span className="text-[11px] text-fg-subtle num">
              Showing {(meta.page - 1) * 50 + 1}–{Math.min(meta.page * 50, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Sheet */}
      <CreateStaffSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={invalidate} />

      {/* Edit Sheet */}
      <EditStaffSheet
        member={editMember}
        open={!!editMember}
        onOpenChange={(v) => {
          if (!v) setEditMember(null);
        }}
        onUpdated={invalidate}
      />
    </div>
  );
}
