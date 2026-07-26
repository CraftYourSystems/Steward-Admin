import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModifierOption } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  priceAdjustment: z.coerce.number().nonnegative("Price adjustment must be 0 or positive"),
  displayOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface ModifierOptionFormProps {
  option?: ModifierOption;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

export function ModifierOptionForm({ option, onSubmit, onCancel }: ModifierOptionFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: option?.name ?? "",
      priceAdjustment: option ? parseFloat(option.priceAdjustment) : 0,
      displayOrder: option?.displayOrder ?? 0,
      active: option?.active ?? true,
    },
  });

  const active = watch("active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-fg">
      <div className="space-y-1.5">
        <Label className="text-[11px] text-fg-muted">Option Name *</Label>
        <Input
          {...register("name")}
          placeholder="e.g. Extra Cheese, Mild, Gluten Free Bread"
          className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
        />
        {errors.name && <p className="text-[11px] text-danger">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-fg-muted">Price Adjustment (₹) *</Label>
        <Input
          type="number"
          step="0.01"
          {...register("priceAdjustment")}
          className="bg-[#1a1a1c] border-white/10 h-10 text-[12px]"
        />
        {errors.priceAdjustment && <p className="text-[11px] text-danger">{errors.priceAdjustment.message}</p>}
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
          id="option-active"
        />
        <Label htmlFor="option-active" className="text-[12px] text-fg font-medium cursor-pointer">
          Active
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 hover:bg-white/5 text-fg">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {option ? "Update Option" : "Create Option"}
        </Button>
      </div>
    </form>
  );
}
