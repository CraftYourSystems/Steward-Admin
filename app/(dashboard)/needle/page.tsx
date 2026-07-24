"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOperationalPhase } from "@/hooks/useOperationalPhase";

export default function NeedlePage() {
  const router = useRouter();
  const { phase, isLoading } = useOperationalPhase();

  useEffect(() => {
    if (isLoading) return;

    // During active service, land on Operations
    // All other phases land on Today
    if (phase === "active-service") {
      router.replace("/needle/operations");
    } else {
      router.replace("/needle/today");
    }
  }, [phase, isLoading, router]);

  return (
    <div className="p-6 text-center text-fg-muted animate-pulse">
      Loading your intelligence...
    </div>
  );
}
