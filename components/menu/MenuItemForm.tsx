"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import type { MenuItem, Category, ApiSuccess } from "@/types";

const schema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive("Price must be positive"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  kitchenType: z.enum(["MAIN", "TIME_TAKING", "READY_TO_SERVE"]),
  isAvailable: z.boolean(),
  isPopular: z.boolean(),
  calories: z.coerce.number().int().positive().optional().or(z.literal("")),
  prepTimeMins: z.coerce.number().int().min(1).max(180),
  sortOrder: z.coerce.number().int(),
});

type FormValues = z.infer<typeof schema>;

interface MenuItemFormProps {
  item?: MenuItem;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function MenuItemForm({ item, categories, onSuccess, onCancel }: MenuItemFormProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(item?.imageUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: item?.category.id ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      price: item ? parseFloat(item.price) : 0,
      imageUrl: item?.imageUrl ?? "",
      kitchenType: item?.kitchenType ?? "MAIN",
      isAvailable: item?.isAvailable ?? true,
      isPopular: item?.isPopular ?? false,
      calories: item?.calories ?? undefined,
      prepTimeMins: item?.prepTimeMins ?? 15,
      sortOrder: item?.sortOrder ?? 0,
    },
  });

  const imageUrl = watch("imageUrl");
  const isAvailable = watch("isAvailable");
  const isPopular = watch("isPopular");
  const kitchenType = watch("kitchenType");

  useEffect(() => {
    setPreviewUrl(imageUrl ?? "");
  }, [imageUrl]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post<ApiSuccess<{ url: string }>>(
        "/menu/admin/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setValue("imageUrl", data.data.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        calories: values.calories === "" ? undefined : values.calories,
        imageUrl: values.imageUrl === "" ? undefined : values.imageUrl,
      };
      if (item) {
        await api.put(`/menu/admin/items/${item.id}`, payload);
        toast.success("Menu item updated");
      } else {
        await api.post("/menu/admin/items", payload);
        toast.success("Menu item created");
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to save item");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-fg">
      {/* Section 1: General Info */}
      <div className="space-y-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
          General Information
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Image upload left column */}
          <div className="space-y-1.5 flex-shrink-0">
            <Label className="text-[11px] text-fg-muted">Image</Label>
            <div
              className={cn(
                "relative group rounded-lg border-2 border-dashed border-white/10 bg-white/5 overflow-hidden cursor-pointer transition-colors aspect-square w-24 h-24 flex items-center justify-center",
                dragOver && "border-accent bg-accent/5",
                uploading && "pointer-events-none opacity-60"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                    <span className="text-[11px] font-medium text-white flex items-center gap-1">
                      <Upload className="h-3 w-3" /> Change
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-fg-subtle p-2 text-center">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-fg" />
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5 opacity-60" />
                      <span className="text-[9px] leading-tight">Drag or click to upload</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
            {previewUrl && (
              <button
                type="button"
                onClick={() => setValue("imageUrl", "")}
                className="flex items-center gap-1 text-[10px] text-danger hover:text-danger/80 transition-colors"
              >
                <X className="h-3 w-3" /> Remove Image
              </button>
            )}
          </div>

          {/* Name and Category right column */}
          <div className="flex-1 w-full space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Category *</Label>
              <Select
                value={watch("categoryId")}
                onValueChange={(v) => setValue("categoryId", v)}
              >
                <SelectTrigger className="bg-[#1a1a1c] border-white/10 h-10 text-[12px] text-fg">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-[11px] text-danger">{errors.categoryId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-fg-muted">Name *</Label>
              <Input
                {...register("name")}
                placeholder="e.g. Butter Chicken"
                className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
              />
              {errors.name && <p className="text-[11px] text-danger">{errors.name.message}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] text-fg-muted">Description</Label>
          <Textarea
            {...register("description")}
            rows={2}
            placeholder="Describe ingredients, portion size, allergen notes..."
            className="bg-[#1a1a1c] border-white/10 text-[12px] resize-none"
          />
        </div>
      </div>

      {/* Section 2: Pricing & Logistics */}
      <div className="space-y-3.5 pt-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
          Pricing & Logistics
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-fg-muted">Price (₹) *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("price")}
              className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
            />
            {errors.price && <p className="text-[11px] text-danger">{errors.price.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-fg-muted">Prep Time (min) *</Label>
            <Input
              type="number"
              {...register("prepTimeMins")}
              className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
            />
            {errors.prepTimeMins && <p className="text-[11px] text-danger">{errors.prepTimeMins.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-fg-muted">Kitchen Type *</Label>
            <Select
              value={kitchenType}
              onValueChange={(v) => setValue("kitchenType", v as "MAIN" | "TIME_TAKING" | "READY_TO_SERVE")}
            >
              <SelectTrigger className="bg-[#1a1a1c] border-white/10 h-10 text-[12px] text-fg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
                <SelectItem value="MAIN" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Main</SelectItem>
                <SelectItem value="TIME_TAKING" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Time Taking</SelectItem>
                <SelectItem value="READY_TO_SERVE" className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">Ready to Serve</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-fg-muted">Calories (optional)</Label>
            <Input
              type="number"
              {...register("calories")}
              placeholder="e.g. 450"
              className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Status & Visibility */}
      <div className="space-y-3.5 pt-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-white/5 pb-1">
          Visibility & Settings
        </div>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-fg-muted">Sort Order</Label>
            <Input
              type="number"
              {...register("sortOrder")}
              className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={isAvailable}
                onCheckedChange={(v) => setValue("isAvailable", v)}
                id="isAvailable"
              />
              <Label htmlFor="isAvailable" className="text-[12px] text-fg font-medium cursor-pointer">Available</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPopular}
                onCheckedChange={(v) => setValue("isPopular", v)}
                id="isPopular"
              />
              <Label htmlFor="isPopular" className="text-[12px] text-fg font-medium cursor-pointer">Popular</Label>
            </div>
          </div>
        </div>
      </div>

      {item && (
        <MenuItemModifiersWrapper menuItemId={item.id} />
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 hover:bg-white/5 text-fg">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {item ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}

// ─── Inline wrapper for MenuItem modifier associations ───────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItemModifierForm } from "./MenuItemModifierForm";
import { MenuItemModifiersSection } from "./MenuItemModifiersSection";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropResult } from "@hello-pangea/dnd";
import type { ModifierGroup, MenuItemModifierGroup } from "@/types";

interface MenuItemModifiersWrapperProps {
  menuItemId: string;
}

function MenuItemModifiersWrapper({ menuItemId }: MenuItemModifiersWrapperProps) {
  const queryClient = useQueryClient();
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);

  // Fetch all available groups to select from
  const { data: allGroups = [] } = useQuery<ModifierGroup[]>({
    queryKey: ["modifier-groups"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<ModifierGroup[]>>("/admin/menu-modifiers/groups");
      return data.data;
    },
  });

  // Fetch groups already attached to this menu item
  const { data: itemData, isLoading } = useQuery<MenuItem>({
    queryKey: ["menu-items", menuItemId],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<MenuItem>>(`/menu/admin/items/${menuItemId}`);
      return data.data;
    },
  });

  // Safe fallback list mapping
  const attachedGroups: MenuItemModifierGroup[] = (itemData as any)?.modifierGroups || [];

  const attachMutation = useMutation({
    mutationFn: async (values: any) => {
      await api.post("/admin/menu-modifiers/assign", {
        menuItemId,
        ...values,
      });
    },
    onSuccess: () => {
      toast.success("Modifier group attached");
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuItemId] });
      setAttachSheetOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to attach modifier group");
    },
  });

  const detachMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await api.post("/admin/menu-modifiers/unassign", {
        menuItemId,
        modifierGroupId: groupId,
      });
    },
    onSuccess: () => {
      toast.success("Modifier group detached");
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuItemId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to detach group");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ groupId, order }: { groupId: string; order: number }) => {
      await api.post("/admin/menu-modifiers/assign", {
        menuItemId,
        modifierGroupId: groupId,
        displayOrder: order,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuItemId] });
    },
  });

  const handleReorder = async (result: DropResult) => {
    if (!result.destination) return;
    const items: MenuItemModifierGroup[] = Array.from(attachedGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update sort order values
    const updated = items.map((item: MenuItemModifierGroup, index: number) => ({
      ...item,
      displayOrder: index,
    }));

    queryClient.setQueryData(["menu-items", menuItemId], (prev: any) => {
      if (!prev) return prev;
      return { ...prev, modifierGroups: updated };
    });

    try {
      for (let i = 0; i < updated.length; i++) {
        await reorderMutation.mutateAsync({
          groupId: updated[i].modifierGroupId,
          order: i,
        });
      }
      toast.success("Reordered modifier groups");
    } catch {
      toast.error("Failed to persist new order");
      queryClient.invalidateQueries({ queryKey: ["menu-items", menuItemId] });
    }
  };

  const unusedGroups = allGroups.filter(
    (g: ModifierGroup) => !attachedGroups.some((link: MenuItemModifierGroup) => link.modifierGroupId === g.id)
  );

  if (isLoading) {
    return <div className="h-20 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-4 border-t border-white/5 pt-4">
      <MenuItemModifiersSection
        attachedGroups={attachedGroups}
        onReorder={handleReorder}
        onDetach={(gid) => detachMutation.mutate(gid)}
        onAddClick={() => setAttachSheetOpen(true)}
      />

      <Sheet open={attachSheetOpen} onOpenChange={setAttachSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0F0F10]">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-fg font-semibold">Attach Modifier Group</SheetTitle>
          </SheetHeader>
          {unusedGroups.length === 0 ? (
            <div className="text-center py-6 text-[12px] text-fg-subtle">
              All available modifier groups are already attached.
            </div>
          ) : (
            <MenuItemModifierForm
              groups={unusedGroups}
              onSubmit={async (values) => {
                await attachMutation.mutateAsync(values);
              }}
              onCancel={() => setAttachSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
