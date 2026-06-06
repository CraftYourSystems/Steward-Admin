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
import { getCsrfHeader } from "@/lib/auth/csrf";
import { hasPermission, Permissions } from "@/lib/permissions/permissions";
import { getRedirectPath } from "@/constants/auth";
import axios from "axios";



const ALLOWED_ROLES    = ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF", "WAITER"];
// All paths where the kitchen socket should be active
const KITCHEN_PATHS    = ["/kitchen", "/kds", "/live-counter"];

let activeRefreshPromise: Promise<string> | null = null;

function getRefreshPromise(): Promise<string> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = axios
    .post("/v1/auth/refresh", {}, {
      withCredentials: true,
      headers: getCsrfHeader(),
    })
    .then(({ data }) => {
      const token = data.data.accessToken;
      useAuthStore.getState().setAccessToken(token);
      return token;
    });

  activeRefreshPromise.finally(() => {
    activeRefreshPromise = null;
  });

  return activeRefreshPromise;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isPendingRefresh, user } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted]         = useState(false);

  const isKitchenPath = KITCHEN_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isDashboard = pathname === "/dashboard";

  useSocket({ enabled: isAdmin && isDashboard });
  useKitchenSocket({ enabled: isKitchenPath });

  useEffect(() => { setMounted(true); }, []);

  const [isSlowConnection, setIsSlowConnection] = useState(false);
  // Track whether the boot-up refresh attempt has settled (success or non-auth error).
  // Without this, a network failure would leave isPendingRefresh=true forever → infinite spinner.
  const [refreshSettled, setRefreshSettled] = useState(false);

  useEffect(() => {
    if (!mounted || !isPendingRefresh) return;

    const slowTimer = setTimeout(() => setIsSlowConnection(true), 5_000);

    getRefreshPromise()
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          // Refresh token is genuinely expired or invalid — force re-login.
          console.warn("[Steward] Refresh token rejected by server, signing out.");
          useAuthStore.getState().clearAuth();
        } else {
          // Network error, server sleeping (Render cold-start), timeout, etc.
          // Keep the cached user in state so the UI doesn't flash a login screen.
          // The axios interceptor will retry on the next API call.
          console.warn("[Steward] Silent refresh failed (non-auth error), keeping session:", err?.message ?? err);
        }
      })
      .finally(() => {
        clearTimeout(slowTimer);
        setIsSlowConnection(false);
        setRefreshSettled(true);
      });

    return () => {
      clearTimeout(slowTimer);
    };
  }, [mounted, isPendingRefresh]);

  useEffect(() => {
    if (!mounted) return;
    if (user && !ALLOWED_ROLES.includes(user.role)) {
      useAuthStore.getState().clearAuth();
      router.replace("/login");
      return;
    }

    // Google-OAuth admins land here before completing restaurant setup.
    // Redirect them to finish onboarding instead of breaking on null restaurantId.
    if (user?.role === "ADMIN" && !user?.restaurantId) {
      router.replace("/register/restaurant-setup");
      return;
    }

    const canUseAdminPage =
      (pathname.startsWith("/dashboard") && hasPermission(user?.role, Permissions.RESTAURANT_MANAGEMENT)) ||
      (pathname.startsWith("/orders") && (hasPermission(user?.role, Permissions.ORDER_MANAGEMENT) || hasPermission(user?.role, Permissions.ORDER_VIEW))) ||
      (pathname.startsWith("/pay-at-counter") && hasPermission(user?.role, Permissions.ORDER_MANAGEMENT)) ||
      (pathname.startsWith("/menu") && hasPermission(user?.role, Permissions.MENU_MANAGEMENT)) ||
      (pathname.startsWith("/staff") && hasPermission(user?.role, Permissions.STAFF_MANAGEMENT)) ||
      (pathname.startsWith("/settings") && hasPermission(user?.role, Permissions.RESTAURANT_MANAGEMENT)) ||
      (pathname.startsWith("/kitchen-home") && hasPermission(user?.role, Permissions.KITCHEN_DASHBOARD)) ||
      (pathname.startsWith("/waiter-home") && hasPermission(user?.role, Permissions.TABLE_MANAGEMENT)) ||
      (pathname.startsWith("/kds") && hasPermission(user?.role, Permissions.KITCHEN_DASHBOARD)) ||
      (pathname.startsWith("/live-counter") && hasPermission(user?.role, Permissions.KITCHEN_DASHBOARD)) ||
      (pathname.startsWith("/audit") && hasPermission(user?.role, Permissions.RESTAURANT_MANAGEMENT)) ||
      (!pathname.startsWith("/dashboard") && !pathname.startsWith("/orders") && !pathname.startsWith("/pay-at-counter") && !pathname.startsWith("/menu") && !pathname.startsWith("/staff") && !pathname.startsWith("/settings") && !pathname.startsWith("/kitchen-home") && !pathname.startsWith("/waiter-home") && !pathname.startsWith("/kds") && !pathname.startsWith("/live-counter") && !pathname.startsWith("/audit"));
    if (!canUseAdminPage && user) {
      router.replace(getRedirectPath(user.role));
    }
  }, [isAuthenticated, isPendingRefresh, user, router, mounted, pathname]);

  // Show the spinner while:
  //   1. Not yet mounted (SSR hydration guard)
  //   2. Still pending refresh AND refresh hasn't settled yet (no infinite spinner)
  //   3. Not authenticated at all (will be redirected by useRequireAuth)
  const isStillRefreshing = isPendingRefresh && !refreshSettled;

  if (!mounted || isStillRefreshing || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-fg-subtle border-t-fg" />
          <p className="text-[11px] font-medium text-fg-subtle tracking-wide uppercase">Loading</p>
          {isSlowConnection && (
            <p className="text-[11px] text-fg-subtle mt-1 max-w-[220px] text-center">
              Server is waking up&nbsp;— this can take up to 60&nbsp;s on the first load.
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
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
