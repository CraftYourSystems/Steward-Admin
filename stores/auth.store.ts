import { create } from 'zustand';
import type { User, BranchSummary } from '@/types';
import {
  USER_STORAGE_KEY,
  RESTAURANT_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  CURRENT_BRANCH_STORAGE_KEY,
  ACCESSIBLE_BRANCHES_STORAGE_KEY,
} from '@/constants/auth';

// ── Security note ──────────────────────────────────────────────────────────────
//
// accessToken  → in-memory ONLY (never localStorage/sessionStorage).
// user         → localStorage (non-sensitive profile; survives hard refresh).
// restaurant   → localStorage (non-sensitive; survives hard refresh).
// currentBranch -> localStorage (non-sensitive; survives hard refresh).
// accessibleBranches -> localStorage (non-sensitive; survives hard refresh).
// refreshToken → httpOnly cookie set by backend (JS-unreadable).
//
// On hard refresh: user+restaurant+branch are restored from localStorage immediately
// so the UI renders without a flash. The axios interceptor calls /auth/refresh
// on the first 401 to silently recover the accessToken from the cookie.
//
// XSS impact: attacker can read user/restaurant profile but NOT call authed APIs.

// ─── Restaurant shape ─────────────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  restaurantCode?: string;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface AuthStore {
  accessToken: string | null;
  /** Non-sensitive profile — persisted for immediate UI render on refresh */
  user: User | null;
  /** Non-sensitive restaurant info — persisted alongside user */
  restaurant: Restaurant | null;
  /** Non-sensitive current active branch — persisted alongside user */
  currentBranch: BranchSummary | null;
  /** Non-sensitive accessible branches — persisted alongside user */
  accessibleBranches: BranchSummary[];
  /** True when a branch switch transaction is in progress */
  isSwitchingBranch: boolean;
  /**
   * True once the store has been initialised on the client and localStorage
   * values have been read. False during SSR. Used by useRequireAuth to prevent
   * redirecting to /login before hydration completes.
   */
  isHydrated: boolean;

  /** Called after a successful email/password login or silent refresh. */
  setAuth: (
    token: string,
    user: User,
    restaurant?: Restaurant | null | undefined,
    currentBranch?: BranchSummary | null,
    accessibleBranches?: BranchSummary[]
  ) => void;
  /** Called by the silent-refresh interceptor — only updates the token. */
  setAccessToken: (token: string) => void;
  /** Set branch switching state */
  setIsSwitchingBranch: (val: boolean) => void;
  /** Hard logout — clears all client state and storage. */
  clearAuth: () => void;
  /** Mark the store as hydrated (called once, client-side, after mount). */
  setHydrated: () => void;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — not fatal, just skip.
  }
}

function remove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

// Temporary legacy token cleanup for returning users
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  // ── Initial state read from localStorage (client-only) ─────────────────────
  // accessToken is in-memory only. Legacy keys are cleared on startup.
  accessToken: null,
  user: read<User>(USER_STORAGE_KEY),
  restaurant: read<Restaurant>(RESTAURANT_STORAGE_KEY),
  currentBranch: read<BranchSummary>(CURRENT_BRANCH_STORAGE_KEY),
  accessibleBranches: read<BranchSummary[]>(ACCESSIBLE_BRANCHES_STORAGE_KEY) || [],
  isSwitchingBranch: false,
  // isHydrated starts false so SSR/edge renders never attempt redirects.
  // setHydrated() is called once by useRequireAuth on the first client mount.
  isHydrated: false,

  setAuth: (token, user, restaurant = undefined, currentBranch = undefined, accessibleBranches = undefined) => {
    write(USER_STORAGE_KEY, user);
    if (restaurant !== undefined) {
      if (restaurant) {
        write(RESTAURANT_STORAGE_KEY, restaurant);
      } else {
        remove(RESTAURANT_STORAGE_KEY);
      }
    }
    if (currentBranch !== undefined) {
      if (currentBranch) {
        write(CURRENT_BRANCH_STORAGE_KEY, currentBranch);
      } else {
        remove(CURRENT_BRANCH_STORAGE_KEY);
      }
    }
    if (accessibleBranches !== undefined) {
      if (accessibleBranches) {
        write(ACCESSIBLE_BRANCHES_STORAGE_KEY, accessibleBranches);
      } else {
        remove(ACCESSIBLE_BRANCHES_STORAGE_KEY);
      }
    }
    set((state) => ({
      accessToken: token,
      user,
      restaurant: restaurant !== undefined ? restaurant : state.restaurant,
      currentBranch: currentBranch !== undefined ? currentBranch : state.currentBranch,
      accessibleBranches: accessibleBranches !== undefined ? accessibleBranches : state.accessibleBranches,
    }));
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  setIsSwitchingBranch: (val) => {
    set({ isSwitchingBranch: val });
  },

  clearAuth: () => {
    remove(TOKEN_STORAGE_KEY);
    remove(REFRESH_TOKEN_STORAGE_KEY);
    remove(USER_STORAGE_KEY);
    remove(RESTAURANT_STORAGE_KEY);
    remove(CURRENT_BRANCH_STORAGE_KEY);
    remove(ACCESSIBLE_BRANCHES_STORAGE_KEY);
    set({ accessToken: null, user: null, restaurant: null, currentBranch: null, accessibleBranches: [], isSwitchingBranch: false });
  },

  setHydrated: () => set({ isHydrated: true }),
}));
