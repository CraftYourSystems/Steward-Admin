"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NeedlePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/needle/briefing");
  }, [router]);

  return (
    <div className="p-6 text-center text-fg-muted animate-pulse">
      Redirecting to Briefing...
    </div>
  );
}
