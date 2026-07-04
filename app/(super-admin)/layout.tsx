"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { getRedirectPath } from "@/constants/auth";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isReady, isAuthenticated, isSlowConnection, user } = useRequireAuth();

  useEffect(() => {
    if (!isReady || !user) return;
    if (user.role !== "SUPER_ADMIN") {
      router.replace(getRedirectPath(user.role));
    }
  }, [isReady, user, router]);

  if (!isReady || !isAuthenticated || !user || user.role !== "SUPER_ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-fg-subtle border-t-fg" />
          <p className="text-[11px] font-medium text-fg-subtle tracking-wide uppercase">Loading</p>
          {isSlowConnection && (
            <p className="text-[11px] text-fg-subtle mt-1 max-w-[220px] text-center">
              Server is waking up&nbsp;&mdash; this can take up to 60&nbsp;s on the first load.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      {children}
    </div>
  );
}
