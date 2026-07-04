"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  usePaymentConfigs,
  useAddPaymentConfig,
  useVerifyPaymentConfig,
  useActivatePaymentConfig,
  useDeactivatePaymentConfig,
  useUpdatePaymentConfigPriority,
  type PaymentConfig,
} from "@/hooks/usePaymentConfigs";

export function PaymentGateways() {
  const { data: configs, isLoading } = usePaymentConfigs();
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-[rgba(var(--on-surface-rgb),0.5)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // Replicate the Routing Pipeline purely for visual indication of the runtime selected provider
  const eligibleConfigs = (configs || []).filter((c: PaymentConfig) => c.isActive && c.isVerified && c.healthStatus !== 'unreachable');
  
  const sortedEligible = [...eligibleConfigs].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  let selectedConfigId: string | null = null;
  if (sortedEligible.length > 0) {
    let selected = sortedEligible[0];
    if (selected.healthStatus === 'degraded') {
      const firstHealthy = sortedEligible.find(c => c.healthStatus === 'healthy');
      if (firstHealthy) selected = firstHealthy;
    }
    selectedConfigId = selected.id;
  }

  // Sort configs so active is first, then newest
  const sortedConfigs = [...(configs || [])].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Payment Gateways</h3>
        <Button onClick={() => setIsAddOpen(true)} size="sm" variant="outline" className="h-8">
          <Plus className="mr-2 h-4 w-4" />
          Add Gateway
        </Button>
      </div>

      {sortedConfigs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(var(--on-surface-rgb),0.2)] p-8 text-center">
          <p className="text-sm text-[rgba(var(--on-surface-rgb),0.5)]">
            No payment gateways configured. Add one to enable online payments.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedConfigs.map((config) => (
            <ConfigCard key={config.id} config={config} isSelected={config.id === selectedConfigId} />
          ))}
        </div>
      )}

      <AddConfigDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}

function ConfigCard({ config, isSelected }: { config: PaymentConfig; isSelected: boolean }) {
  const verifyMut = useVerifyPaymentConfig();
  const activateMut = useActivatePaymentConfig();
  const deactivateMut = useDeactivatePaymentConfig();
  const priorityMut = useUpdatePaymentConfigPriority();

  const isPending = verifyMut.isPending || activateMut.isPending || deactivateMut.isPending || priorityMut.isPending;

  return (
    <div className={`rounded-xl border p-4 transition-colors ${config.isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[rgba(var(--on-surface-rgb),0.1)]'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground capitalize">{config.provider}</h4>
            <Badge variant="outline" className="capitalize text-[10px] h-5">
              {config.environment}
            </Badge>
            {config.isActive ? (
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] h-5">Enabled</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-5">Disabled</Badge>
            )}
            {/* Eligibility & Selection Status */}
            {config.isActive && config.isVerified && config.healthStatus !== 'unreachable' && (
              <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[10px] h-5">Eligible</Badge>
            )}
            {isSelected && (
              <Badge className="bg-purple-500 text-white hover:bg-purple-600 text-[10px] h-5">Primary Routing</Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-[rgba(var(--on-surface-rgb),0.5)]">
            <span>Version: {config.version}</span>
            <span className="flex items-center gap-1">
              Priority: {config.priority}
              {config.isActive && (
                <span className="flex gap-0.5 ml-1">
                  <Button 
                    size="icon" variant="ghost" className="h-4 w-4" 
                    disabled={isPending || config.priority === 0} 
                    onClick={() => priorityMut.mutate({ id: config.id, priority: Math.max(0, config.priority - 1) })}
                  >
                    ↑
                  </Button>
                  <Button 
                    size="icon" variant="ghost" className="h-4 w-4" 
                    disabled={isPending} 
                    onClick={() => priorityMut.mutate({ id: config.id, priority: config.priority + 1 })}
                  >
                    ↓
                  </Button>
                </span>
              )}
            </span>
            <span>Created: {new Date(config.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              {config.isVerified ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <ShieldAlert className="h-3.5 w-3.5" /> Unverified
                </span>
              )}
            </div>
            
            <div className="w-px h-3 bg-[rgba(var(--on-surface-rgb),0.2)] hidden sm:block" />

            <div className="flex items-center gap-1.5">
              {config.healthStatus === 'healthy' && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                </span>
              )}
              {config.healthStatus === 'degraded' && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-3.5 w-3.5" /> Degraded
                </span>
              )}
              {config.healthStatus === 'unreachable' && (
                <span className="flex items-center gap-1 text-rose-600">
                  <XCircle className="h-3.5 w-3.5" /> Unreachable
                </span>
              )}
              {(config.healthStatus === 'unknown' || !config.healthStatus) && (
                <span className="flex items-center gap-1 text-[rgba(var(--on-surface-rgb),0.5)]">
                  <Clock className="h-3.5 w-3.5" /> Unknown Health
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[10px] text-[rgba(var(--on-surface-rgb),0.5)]">
            {config.lastVerifiedAt && <div>Last Verified: {new Date(config.lastVerifiedAt).toLocaleString()}</div>}
            {config.lastSuccessfulPaymentAt && <div>Last Payment: {new Date(config.lastSuccessfulPaymentAt).toLocaleString()}</div>}
            {config.lastWebhookReceivedAt && <div>Last Webhook: {new Date(config.lastWebhookReceivedAt).toLocaleString()}</div>}
            {config.consecutiveFailures > 0 && <div className="text-amber-600">Consecutive Failures: {config.consecutiveFailures}</div>}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 items-end">
          {!config.isVerified && (
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-7 text-xs px-3"
              disabled={isPending}
              onClick={() => verifyMut.mutate(config.id)}
            >
              {verifyMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Verify Credentials
            </Button>
          )}
          
          {config.isVerified && !config.isActive && (
            <Button 
              size="sm" 
              className="h-7 text-xs px-3"
              disabled={isPending}
              onClick={() => activateMut.mutate(config.id)}
            >
              {activateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Activate
            </Button>
          )}

          {config.isActive && (
            <Button 
              size="sm" 
              variant="destructive"
              className="h-7 text-xs px-3"
              disabled={isPending}
              onClick={() => deactivateMut.mutate(config.id)}
            >
              {deactivateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Deactivate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [provider, setProvider] = useState<string>("razorpay");
  const [environment, setEnvironment] = useState<string>("sandbox");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  
  const addMut = useAddPaymentConfig();

  const handleSave = () => {
    addMut.mutate(
      { provider, environment, credentials },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCredentials({});
        },
      }
    );
  };

  const isFormValid = () => {
    if (provider === "razorpay") {
      return !!credentials.key_id && !!credentials.key_secret;
    }
    if (provider === "phonepe") {
      return !!credentials.merchant_id && !!credentials.salt_key && !!credentials.salt_index;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Gateway</DialogTitle>
          <DialogDescription>
            Configure a new payment provider. Credentials are encrypted before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase text-[rgba(var(--on-surface-rgb),0.5)]">Provider</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="phonepe">PhonePe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase text-[rgba(var(--on-surface-rgb),0.5)]">Environment</label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox / Test</SelectItem>
                <SelectItem value="uat">UAT</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-foreground border-b pb-1">Credentials</h4>
            
            {provider === "razorpay" && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] text-[rgba(var(--on-surface-rgb),0.6)]">Key ID</label>
                  <Input 
                    placeholder="rzp_test_..." 
                    value={credentials.key_id || ""}
                    onChange={(e) => setCredentials(prev => ({ ...prev, key_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[rgba(var(--on-surface-rgb),0.6)]">Key Secret</label>
                  <Input 
                    type="password"
                    placeholder="••••••••••••" 
                    value={credentials.key_secret || ""}
                    onChange={(e) => setCredentials(prev => ({ ...prev, key_secret: e.target.value }))}
                  />
                </div>
              </>
            )}

            {provider === "phonepe" && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] text-[rgba(var(--on-surface-rgb),0.6)]">Merchant ID</label>
                  <Input 
                    placeholder="MERCHANTUAT" 
                    value={credentials.merchant_id || ""}
                    onChange={(e) => setCredentials(prev => ({ ...prev, merchant_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[rgba(var(--on-surface-rgb),0.6)]">Salt Key</label>
                  <Input 
                    type="password"
                    placeholder="••••••••••••" 
                    value={credentials.salt_key || ""}
                    onChange={(e) => setCredentials(prev => ({ ...prev, salt_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[rgba(var(--on-surface-rgb),0.6)]">Salt Index</label>
                  <Input 
                    placeholder="1" 
                    value={credentials.salt_index || ""}
                    onChange={(e) => setCredentials(prev => ({ ...prev, salt_index: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isFormValid() || addMut.isPending}>
            {addMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
