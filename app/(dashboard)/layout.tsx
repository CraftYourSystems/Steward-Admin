"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/stores/auth.store";
import { useSocket } from "@/hooks/useSocket";
import { useKitchenSocket } from "@/hooks/useKitchenSocket";
import { useRequireAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { hasPermission, Permissions } from "@/lib/permissions/permissions";
import { getRedirectPath } from "@/constants/auth";
import { usePlatformStore } from "@/stores/platform.store";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF", "WAITER"];
// All paths where the kitchen socket should be active
const KITCHEN_PATHS = ["/kitchen", "/kds", "/live-counter"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  // useRequireAuth handles:
  //   - Hydration guard (prevents SSR/hydration mismatch redirects)
  //   - Cold-start silent refresh (httpOnly cookie → localStorage empty)
  //   - Pending-refresh path (user cached, token missing from memory)
  //   - Redirect to /login if genuinely unauthenticated
  const { isReady, isAuthenticated, isSlowConnection, user } = useRequireAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isKitchenPath = KITCHEN_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin       = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isDashboard   = pathname === "/dashboard" || pathname === "/analytics";

  useSocket({ enabled: isAdmin && isDashboard });
  useKitchenSocket({ enabled: isKitchenPath });

  // ── Role + permission guard ───────────────────────────────────────────────
  // Only runs after the auth state has settled (isReady = true).
  useEffect(() => {
    if (!isReady || !user) return;

    // Super Admin without a selected restaurant → go to platform dashboard
    if (user.role === "SUPER_ADMIN" && !usePlatformStore.getState().selectedRestaurant) {
      router.replace("/platform");
      return;
    }

    // Unknown role — clear and redirect
    if (!ALLOWED_ROLES.includes(user.role)) {
      useAuthStore.getState().clearAuth();
      router.replace("/login");
      return;
    }

    // Google-OAuth admins without a restaurant → finish onboarding first
    if (user.role === "ADMIN" && !user.restaurantId) {
      router.replace("/register/restaurant-setup");
      return;
    }

    // Per-route permission check
    const canUseAdminPage =
      (pathname.startsWith("/dashboard")     && hasPermission(user.role, Permissions.RESTAURANT_MANAGEMENT)) ||
      (pathname.startsWith("/analytics")     && hasPermission(user.role, Permissions.RESTAURANT_MANAGEMENT)) ||
      (pathname.startsWith("/orders")        && (hasPermission(user.role, Permissions.ORDER_MANAGEMENT) || hasPermission(user.role, Permissions.ORDER_VIEW))) ||
      (pathname.startsWith("/pay-at-counter")&& hasPermission(user.role, Permissions.ORDER_MANAGEMENT)) ||
      (pathname.startsWith("/menu")          && hasPermission(user.role, Permissions.MENU_MANAGEMENT)) ||
      (pathname.startsWith("/staff")         && hasPermission(user.role, Permissions.STAFF_MANAGEMENT)) ||
      (pathname.startsWith("/settings")      && hasPermission(user.role, Permissions.RESTAURANT_MANAGEMENT)) ||
      (pathname.startsWith("/kitchen-home")  && hasPermission(user.role, Permissions.KITCHEN_DASHBOARD)) ||
      (pathname.startsWith("/waiter-home")   && hasPermission(user.role, Permissions.TABLE_MANAGEMENT)) ||
      (pathname.startsWith("/kds")           && hasPermission(user.role, Permissions.KITCHEN_DASHBOARD)) ||
      (pathname.startsWith("/live-counter")  && hasPermission(user.role, Permissions.KITCHEN_DASHBOARD)) ||
      (pathname.startsWith("/audit")         && hasPermission(user.role, Permissions.RESTAURANT_MANAGEMENT)) ||
      // Any unlisted path is allowed through (avoids false negatives for new routes)
      (!pathname.startsWith("/dashboard")    &&
       !pathname.startsWith("/analytics")    &&
       !pathname.startsWith("/orders")       &&
       !pathname.startsWith("/pay-at-counter")&&
       !pathname.startsWith("/menu")         &&
       !pathname.startsWith("/staff")        &&
       !pathname.startsWith("/settings")     &&
       !pathname.startsWith("/kitchen-home") &&
       !pathname.startsWith("/waiter-home")  &&
       !pathname.startsWith("/kds")          &&
       !pathname.startsWith("/live-counter") &&
       !pathname.startsWith("/audit"));

    if (!canUseAdminPage) {
      router.replace(getRedirectPath(user.role));
    }
  }, [isReady, user, router, pathname]);

  // ── Loading / cold-start spinner ─────────────────────────────────────────
  // Show while:
  //   1. Auth state hasn't settled yet (hydration + any silent refresh)
  //   2. Genuinely unauthenticated (useRequireAuth is redirecting)
  if (!isReady || !isAuthenticated || !user) {
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
    <div className="flex h-screen overflow-hidden bg-bg text-fg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <ErrorBoundary>
            <OnboardingWizard />
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
