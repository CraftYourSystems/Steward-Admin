import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModifierGroup } from "@/types";

const schema = z.object({
  modifierGroupId: z.string().min(1, "Modifier group selection is required"),
  required: z.boolean().default(false),
  minimumSelections: z.coerce.number().int().nonnegative().default(0),
  maximumSelections: z.coerce.number().int().positive().default(1),
  displayOrder: z.coerce.number().int().default(0),
}).superRefine((data, ctx) => {
  if (data.minimumSelections > data.maximumSelections) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum selections cannot exceed maximum selections",
      path: ["minimumSelections"],
    });
  }
});

type FormValues = z.infer<typeof schema>;

interface MenuItemModifierFormProps {
  groups: ModifierGroup[];
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

export function MenuItemModifierForm({ groups, onSubmit, onCancel }: MenuItemModifierFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      modifierGroupId: "",
      required: false,
      minimumSelections: 0,
      maximumSelections: 1,
      displayOrder: 0,
    },
  });

  const modifierGroupId = watch("modifierGroupId");
  const required = watch("required");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-fg">
      <div className="space-y-1.5">
        <Label className="text-[11px] text-fg-muted">Select Modifier Group *</Label>
        <Select
          value={modifierGroupId}
          onValueChange={(v) => setValue("modifierGroupId", v)}
        >
          <SelectTrigger className="bg-[#1a1a1c] border-white/10 h-10 text-[12px] text-fg">
            <SelectValue placeholder="Choose a group" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1c] border-white/10 text-fg text-[12px]">
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id} className="text-[12px] focus:bg-white/5 focus:text-fg text-fg">
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.modifierGroupId && <p className="text-[11px] text-danger">{errors.modifierGroupId.message}</p>}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Switch
          checked={required}
          onCheckedChange={(v) => setValue("required", v)}
          id="item-required"
        />
        <Label htmlFor="item-required" className="text-[12px] text-fg font-medium cursor-pointer">
          Required modifier group selection
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-fg-muted">Min Selections</Label>
          <Input
            type="number"
            {...register("minimumSelections")}
            className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
          />
          {errors.minimumSelections && <p className="text-[11px] text-danger">{errors.minimumSelections.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] text-fg-muted">Max Selections</Label>
          <Input
            type="number"
            {...register("maximumSelections")}
            className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
          />
          {errors.maximumSelections && <p className="text-[11px] text-danger">{errors.maximumSelections.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-fg-muted">Display Order</Label>
        <Input
          type="number"
          {...register("displayOrder")}
          className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 hover:bg-white/5 text-fg">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Attach Group
        </Button>
      </div>
    </form>
  );
}
