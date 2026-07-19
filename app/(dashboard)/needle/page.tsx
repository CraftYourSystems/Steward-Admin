"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOperationalPhase } from "@/hooks/useOperationalPhase";

export default function NeedlePage() {
  const router = useRouter();
  const { phase, isLoading } = useOperationalPhase();

  useEffect(() => {
    if (isLoading) return;

    // During active service, land on Live Health
    // All other phases land on Briefing
    if (phase === "active-service") {
      router.replace("/needle/live-health");
    } else {
      router.replace("/needle/briefing");
    }
  }, [phase, isLoading, router]);

  return (
    <div className="p-6 text-center text-fg-muted animate-pulse">
      Preparing your briefing...
    </div>
  );
}
