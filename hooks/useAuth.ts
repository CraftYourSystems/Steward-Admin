'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { disconnectSocket } from '@/lib/sockets';
import { getRedirectPath } from '@/constants/auth';
import { silentRefresh } from '@/lib/auth/refresh';
import type { User, BranchSummary } from '@/types';
import type { Restaurant } from '@/stores/auth.store';
import { setCsrfToken } from '@/lib/auth/csrf';
import { toast } from 'sonner';

// ─── Primary hook — used everywhere inside dashboard layout ──────────────────

export function useAuth() {
  const {
    accessToken,
    user,
    restaurant,
    currentBranch,
    accessibleBranches,
    isSwitchingBranch,
    setAuth,
    setAccessToken,
    setIsSwitchingBranch,
    clearAuth,
  } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore — clear client state regardless
    } finally {
      queryClient.clear();
      localStorage.clear();
      clearAuth();
      disconnectSocket();
      router.push('/login');
    }
  }, [clearAuth, queryClient, router]);

  const switchBranch = useCallback(async (branchId: string) => {
    if (isSwitchingBranch) return;
    setIsSwitchingBranch(true);
    try {
      const { data } = await api.post('/auth/switch-branch', { branchId });
      const payload = data.data; // { accessToken, currentBranch, csrfToken }

      if (payload.csrfToken) {
        setCsrfToken(payload.csrfToken);
      }

      // Atomically update store. Keep accessibleBranches and user/restaurant context.
      setAuth(
        payload.accessToken,
        user!,
        restaurant,
        payload.currentBranch,
        accessibleBranches
      );

      // Reconnect websocket with new token
      const { updateSocketAuth } = await import('@/lib/sockets');
      updateSocketAuth(payload.accessToken);

      // Clear operational cache data completely
      queryClient.clear();

      toast.success(`Switched to branch: ${payload.currentBranch.name}`);
    } catch (err: any) {
      console.error('Failed to switch branch:', err);
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error?.message ??
        'Failed to switch branch';

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error('Session expired. Please sign in again.');
        clearAuth();
        router.push('/login');
      } else {
        toast.error(message);
      }
    } finally {
      setIsSwitchingBranch(false);
    }
  }, [isSwitchingBranch, user, restaurant, accessibleBranches, setAuth, setIsSwitchingBranch, clearAuth, queryClient, router]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isStaff = user?.role === 'KITCHEN_STAFF' || user?.role === 'WAITER';

  return {
    accessToken,
    user,
    restaurant,
    currentBranch,
    accessibleBranches,
    isSwitchingBranch,
    isAdmin,
    isStaff,
    setAuth,
    setAccessToken,
    clearAuth,
    switchBranch,
    logout,
  };
}

// ─── Route guard hook — used in dashboard layouts ────────────────────────────

interface UseRequireAuthOptions {
  redirectTo?: string;
  /** If true, redirect already-authed users (use on login/register pages). */
  redirectIfAuthenticated?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/login', redirectIfAuthenticated = false } = options;
  const { accessToken, user, isHydrated, setHydrated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // "known authenticated" = has a token OR a cached user (pending silent refresh)
  const isAuthenticated = !!(accessToken || user);
  const isPendingRefresh = !accessToken && !!user;

  // ── Cold-start recovery state ─────────────────────────────────────────────
  const coldStartAttempted = useRef(false);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  // ── Eager pending session restoration state ───────────────────────────────
  const eagerRefreshAttempted = useRef(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  // ── Context sync / /auth/me state ─────────────────────────────────────────
  const [isFetchingMe, setIsFetchingMe] = useState(false);

  // ── Step 1: Hydrate the store on first client mount ───────────────────────
  useEffect(() => {
    if (!isHydrated) {
      setHydrated();
    }
  }, []);

  // ── Step 2: Cold-start silent refresh ─────────────────────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated) return;
    if (redirectIfAuthenticated) return;
    if (coldStartAttempted.current) return;
    coldStartAttempted.current = true;

    setIsColdStarting(true);
    const slowTimer = setTimeout(() => setIsSlowConnection(true), 5_000);

    silentRefresh()
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          console.warn('[Steward] Cold-start refresh rejected, redirecting to login.');
          clearAuth();
        } else {
          console.warn('[Steward] Cold-start refresh network error, keeping state:', err?.message ?? err);
        }
      })
      .finally(() => {
        clearTimeout(slowTimer);
        setIsSlowConnection(false);
        setIsColdStarting(false);
      });

    return () => clearTimeout(slowTimer);
  }, [isHydrated, isAuthenticated, redirectIfAuthenticated, clearAuth]);

  // ── Step 2.5: Eager pending session restoration ───────────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    if (!isPendingRefresh) return;
    if (redirectIfAuthenticated) return;
    if (eagerRefreshAttempted.current) return;
    eagerRefreshAttempted.current = true;

    setIsRestoringSession(true);
    const slowTimer = setTimeout(() => setIsSlowConnection(true), 5_000);

    silentRefresh()
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          console.warn('[Steward] Eager session restoration rejected, redirecting to login.');
          clearAuth();
        } else {
          console.warn('[Steward] Eager session restoration network error, keeping state:', err?.message ?? err);
        }
      })
      .finally(() => {
        clearTimeout(slowTimer);
        setIsSlowConnection(false);
        setIsRestoringSession(false);
      });

    return () => clearTimeout(slowTimer);
  }, [isHydrated, isPendingRefresh, redirectIfAuthenticated, clearAuth]);

  // ── Step 2.7: Sync user/restaurant/branch profile via /auth/me ───────────
  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken) return;
    if (redirectIfAuthenticated) return;

    let active = true;
    setIsFetchingMe(true);

    api.get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        const payload = data.data;
        setAuth(
          accessToken,
          payload.user,
          payload.restaurant,
          payload.currentBranch,
          payload.accessibleBranches
        );
      })
      .catch((err) => {
        console.error('Failed to sync profile context:', err);
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          clearAuth();
          router.replace('/login');
        }
      })
      .finally(() => {
        if (active) setIsFetchingMe(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, isHydrated, redirectIfAuthenticated, setAuth, clearAuth, router]);

  // ── Step 3: Redirect logic ────────────────────────────────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    if (isColdStarting) return;
    if (isRestoringSession) return;

    if (redirectIfAuthenticated && isAuthenticated && user) {
      router.replace(getRedirectPath(user.role));
      return;
    }

    if (!redirectIfAuthenticated && !isAuthenticated) {
      const callbackUrl = encodeURIComponent(pathname ?? '/dashboard');
      router.replace(`${redirectTo}?next=${callbackUrl}`);
    }
  }, [isHydrated, isColdStarting, isRestoringSession, isAuthenticated, redirectIfAuthenticated, redirectTo, router, pathname, user]);

  return {
    isReady: isHydrated && !isColdStarting && !isRestoringSession && (!isPendingRefresh || eagerRefreshAttempted.current) && (user ? true : !isFetchingMe),
    isAuthenticated,
    isPendingRefresh,
    isColdStarting,
    isRestoringSession,
    isSlowConnection,
    user,
  };
}

export type { User, Restaurant };
