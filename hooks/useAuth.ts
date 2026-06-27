'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { disconnectSocket } from '@/lib/sockets';
import { getRedirectPath } from '@/constants/auth';
import { silentRefresh } from '@/lib/auth/refresh';
import type { User } from '@/types';
import type { Restaurant } from '@/stores/auth.store';

// ─── Primary hook — used everywhere inside dashboard layout ──────────────────

export function useAuth() {
  const { accessToken, user, restaurant, setAuth, setAccessToken, clearAuth } = useAuthStore();
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

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isStaff = user?.role === 'KITCHEN_STAFF' || user?.role === 'WAITER';

  return {
    accessToken,
    user,
    restaurant,
    isAdmin,
    isStaff,
    setAuth,
    setAccessToken,
    clearAuth,
    logout,
  };
}

// ─── Route guard hook — used in dashboard layouts ────────────────────────────
//
// Usage:
//   const { isReady, isAuthenticated, isColdStarting } = useRequireAuth();
//   if (!isReady) return <FullPageSpinner />;
//
// Authentication states on a hard refresh:
//
//   ① Normal case — token + user both in localStorage:
//       accessToken ≠ null, user ≠ null → isAuthenticated = true immediately.
//       No network call needed before rendering.
//
//   ② Pending-refresh — user in localStorage but token missing from memory:
//       (This should not happen with the current localStorage-persisted token,
//        but kept for resilience.) isPendingRefresh = true, silent refresh runs.
//
//   ③ Cold-start — localStorage empty (cleared, private browsing, iOS ITP):
//       accessToken = null, user = null → isAuthenticated = false.
//       We attempt a silent refresh via the httpOnly cookie BEFORE redirecting.
//       If it succeeds the store is populated and the user stays on the page.
//       Only after the attempt settles (success or hard auth failure) do we
//       redirect — preventing false positives on valid sessions.

interface UseRequireAuthOptions {
  redirectTo?: string;
  /** If true, redirect already-authed users (use on login/register pages). */
  redirectIfAuthenticated?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/login', redirectIfAuthenticated = false } = options;
  const { accessToken, user, isHydrated, setHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // "known authenticated" = has a token OR a cached user (pending silent refresh)
  const isAuthenticated = !!(accessToken || user);
  // True when user is cached but access token hasn't been refreshed yet
  const isPendingRefresh = !accessToken && !!user;

  // ── Cold-start recovery state ─────────────────────────────────────────────
  // We need to attempt a silent refresh when the store is completely empty
  // (no user, no token). Only run once per mount.
  const coldStartAttempted = useRef(false);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  // ── Eager pending session restoration state ───────────────────────────────
  const eagerRefreshAttempted = useRef(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  // ── Step 1: Hydrate the store on first client mount ───────────────────────
  useEffect(() => {
    if (!isHydrated) {
      setHydrated();
    }
  }, []);

  // ── Step 2: Cold-start silent refresh ─────────────────────────────────────
  // Runs when there is absolutely nothing in the store (localStorage was empty).
  // We try the httpOnly cookie before deciding to redirect to /login.
  useEffect(() => {
    if (!isHydrated) return;              // wait for hydration
    if (isAuthenticated) return;          // already have a session
    if (redirectIfAuthenticated) return;  // on login page — don't refresh
    if (coldStartAttempted.current) return;
    coldStartAttempted.current = true;

    setIsColdStarting(true);
    const slowTimer = setTimeout(() => setIsSlowConnection(true), 5_000);

    silentRefresh()
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          // Cookie is expired/invalid — genuinely not logged in.
          console.warn('[Steward] Cold-start refresh rejected, redirecting to login.');
          useAuthStore.getState().clearAuth();
        } else {
          // Network error, server sleeping, etc. — keep the user on the page.
          // The axios interceptor will retry on the next API call.
          console.warn('[Steward] Cold-start refresh network error, keeping state:', err?.message ?? err);
        }
      })
      .finally(() => {
        clearTimeout(slowTimer);
        setIsSlowConnection(false);
        setIsColdStarting(false);
      });

    return () => clearTimeout(slowTimer);
  }, [isHydrated, isAuthenticated, redirectIfAuthenticated]);

  // ── Step 2.5: Eager pending session restoration ───────────────────────────
  // Runs when the user is cached but the access token is null in memory.
  // Eagerly attempts silent refresh before rendering layout children.
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
          useAuthStore.getState().clearAuth();
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
  }, [isHydrated, isPendingRefresh, redirectIfAuthenticated]);

  // ── Step 3: Redirect logic ────────────────────────────────────────────────
  // Only fires after hydration AND after any cold-start/eager-start attempt has settled.
  useEffect(() => {
    if (!isHydrated) return;       // wait for localStorage read
    if (isColdStarting) return;    // wait for cold-start refresh attempt
    if (isRestoringSession) return; // wait for eager session restoration

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
    /** True once hydration + any cold-start/eager-start attempts have settled. */
    isReady: isHydrated && !isColdStarting && !isRestoringSession && (!isPendingRefresh || eagerRefreshAttempted.current),
    isAuthenticated,
    isPendingRefresh,
    isColdStarting,
    isRestoringSession,
    isSlowConnection,
    user,
  };
}

export type { User, Restaurant };
