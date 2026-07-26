import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModifierGroup } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(255).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface ModifierGroupFormProps {
  group?: ModifierGroup;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

export function ModifierGroupForm({ group, onSubmit, onCancel }: ModifierGroupFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
      displayOrder: group?.displayOrder ?? 0,
      active: group?.active ?? true,
    },
  });

  const active = watch("active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-fg">
      <div className="space-y-1.5">
        <Label className="text-[11px] text-fg-muted">Group Name *</Label>
        <Input
          {...register("name")}
          placeholder="e.g. Spice Level, Add-ons"
          className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
        />
        {errors.name && <p className="text-[11px] text-danger">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-fg-muted">Description</Label>
        <Input
          {...register("description")}
          placeholder="e.g. Choose spice severity level"
          className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
        />
        {errors.description && <p className="text-[11px] text-danger">{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-fg-muted">Display Order</Label>
        <Input
          type="number"
          {...register("displayOrder")}
          className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Switch
          checked={active}
          onCheckedChange={(v) => setValue("active", v)}
          id="group-active"
        />
        <Label htmlFor="group-active" className="text-[12px] text-fg font-medium cursor-pointer">
          Active
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 hover:bg-white/5 text-fg">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {group ? "Update Group" : "Create Group"}
        </Button>
      </div>
    </form>
  );
}
