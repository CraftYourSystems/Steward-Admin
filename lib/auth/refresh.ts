/**
 * lib/auth/refresh.ts
 *
 * Shared silent-refresh singleton used by:
 *   - DashboardLayout (normal refresh: user in localStorage, no token in memory)
 *   - useRequireAuth  (cold-start: localStorage is empty, httpOnly cookie may be valid)
 *
 * Only one /auth/refresh request is ever in flight at a time. Any concurrent
 * caller receives the same Promise.
 *
 * Returns the raw backend data so callers can populate the store fully
 * (accessToken + refreshToken + user + restaurant if the backend sends them).
 */

import axios from 'axios';
import { getCsrfHeader, setCsrfToken } from '@/lib/auth/csrf';
import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types';
import type { Restaurant } from '@/stores/auth.store';

// ─── Response shape ───────────────────────────────────────────────────────────

export interface RefreshPayload {
  accessToken: string;
  refreshToken?: string | null;
  /** Present when the backend embeds the user in the refresh response. */
  user?: User | null;
  /** Present when the backend embeds the restaurant in the refresh response. */
  restaurant?: Restaurant | null;
  /** CSRF token provided on successful refresh */
  csrfToken?: string;
}

// ─── In-flight deduplication ──────────────────────────────────────────────────

let activeRefreshPromise: Promise<RefreshPayload> | null = null;

/**
 * Attempt a silent token refresh.
 *
 * - Deduplicates: multiple concurrent callers share one network request.
 * - Reads the refresh-token fallback from localStorage (for non-httpOnly flows).
 * - On success: updates the auth store automatically.
 * - On auth failure (401/403): clears the store (caller should redirect to /login).
 * - On network failure: leaves state intact so the user isn't logged out.
 */
export function silentRefresh(): Promise<RefreshPayload> {
  if (activeRefreshPromise) return activeRefreshPromise;

  activeRefreshPromise = axios
    .post<{ data: RefreshPayload }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: getCsrfHeader() },
    )
    .then(({ data }) => {
      const payload = data.data;

      // Always update the access token when we have one.
      if (payload.accessToken) {
        if (payload.user) {
          // Full session restore (backend returns user + restaurant).
          useAuthStore
            .getState()
            .setAuth(
              payload.accessToken,
              payload.user,
              payload.restaurant ?? undefined,
            );
        } else {
          // Token-only response — just update the token (user stays from localStorage).
          useAuthStore
            .getState()
            .setAccessToken(payload.accessToken);
        }
      }

      if (payload.csrfToken) {
        setCsrfToken(payload.csrfToken);
      }

      return payload;
    })
    .finally(() => {
      activeRefreshPromise = null;
    });

  return activeRefreshPromise;
}
