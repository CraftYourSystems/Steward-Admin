"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/auth.store";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import api from "@/lib/axios";
import { toast } from "sonner";
import { extractApiError } from "@/lib/apiError";
import { useQueryClient } from "@tanstack/react-query";
import { SETTINGS_QUERY_KEY } from "@/hooks/useRestaurantSettings";
import { Building2, MapPin, Settings2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const onboardSchema = z.object({
  description: z.string().max(1000).optional(),
  phone: z.string().max(20).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  upiId: z.string().max(255).optional(),
});

type OnboardData = z.infer<typeof onboardSchema>;

export function OnboardingWizard() {
  const { user } = useAuthStore();
  const { data: settings, isLoading } = useRestaurantSettings();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardData>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      description: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      timezone: "Asia/Kolkata",
      currency: "INR",
      taxRate: 5,
      upiId: "",
    },
  });

  // Only show if user is admin and settings loaded and it seems they haven't onboarded
  if (isLoading || !settings) return null;
  
  // We only show this to ADMINs
  if (user?.role !== "ADMIN") return null;

  // If they already have a phone number, assume they completed onboarding
  const hasOnboarded = !!settings.phone && !!settings.address;
  if (hasOnboarded || !isOpen) return null;

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleSkip = () => setStep((s) => Math.min(s + 1, 3));

  const onSubmit = async (data: OnboardData) => {
    try {
      setIsSubmitting(true);

      const addressObj = {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
      };

      const payload = {
        description: data.description || null,
        phone: data.phone || null,
        address: Object.values(addressObj).some(Boolean) ? addressObj : null,
        timezone: data.timezone,
        currency: data.currency,
        taxRate: data.taxRate,
        upiId: data.upiId || null,
      };

      await api.patch("/settings/onboard", payload);
      
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success("Welcome aboard! Your restaurant is set up.");
      setIsOpen(false);
    } catch (error) {
      toast.error(extractApiError(error, "Failed to complete onboarding"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Steward!</DialogTitle>
          <DialogDescription>
            Let's get your restaurant set up so you can start taking orders.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-between items-center mb-6">
            <div className={`flex flex-col items-center gap-2 ${step >= 1 ? "text-brand" : "text-fg-muted"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-brand bg-brand/10" : "border-border bg-bg-muted"}`}>
                <Building2 size={16} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-medium">Business</span>
            </div>
            <div className={`h-[2px] flex-1 mx-2 ${step >= 2 ? "bg-brand" : "bg-border"}`} />
            <div className={`flex flex-col items-center gap-2 ${step >= 2 ? "text-brand" : "text-fg-muted"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-brand bg-brand/10" : "border-border bg-bg-muted"}`}>
                <MapPin size={16} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-medium">Location</span>
            </div>
            <div className={`h-[2px] flex-1 mx-2 ${step >= 3 ? "bg-brand" : "bg-border"}`} />
            <div className={`flex flex-col items-center gap-2 ${step >= 3 ? "text-brand" : "text-fg-muted"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-brand bg-brand/10" : "border-border bg-bg-muted"}`}>
                <Settings2 size={16} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-medium">Settings</span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(step === 3 ? onSubmit : handleNext)} className="space-y-4">
            
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone Number</Label>
                  <Input id="phone" placeholder="+1 (555) 000-0000" {...form.register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Restaurant Description / Cuisine</Label>
                  <Textarea id="description" placeholder="e.g. Italian Fine Dining" {...form.register("description")} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" placeholder="123 Main St" {...form.register("street")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...form.register("city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...form.register("state")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" {...form.register("zip")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...form.register("country")} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select onValueChange={(val) => form.setValue("currency", val)} defaultValue={form.getValues("currency")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...form.register("taxRate", { valueAsNumber: true })} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID (for payments)</Label>
                  <Input id="upiId" placeholder="merchant@upi" {...form.register("upiId")} />
                  <p className="text-[11px] text-fg-subtle">Optional. Used for generating payment QR codes.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>
              ) : (
                <div /> // Spacer
              )}
              
              <div className="flex gap-2">
                {step < 3 && (
                  <Button type="button" variant="ghost" onClick={handleSkip}>Skip</Button>
                )}
                {step < 3 ? (
                  <Button type="submit" className="bg-brand text-brand-fg hover:bg-brand/90">Next</Button>
                ) : (
                  <Button type="submit" className="bg-brand text-brand-fg hover:bg-brand/90" disabled={isSubmitting}>
                    {isSubmitting ? "Completing..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
