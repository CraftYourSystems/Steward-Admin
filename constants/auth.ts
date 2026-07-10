// ─── Auth constants ───────────────────────────────────────────────────────────

export const AUTH_TABS = {
  ADMIN: 'admin',
  STAFF: 'staff',
} as const;

export type AuthTab = (typeof AUTH_TABS)[keyof typeof AUTH_TABS];

/** Maps user role to the correct post-login destination. */
import type { UserRole } from '@/types';

/** Maps user role to the correct post-login destination. */
export function getRedirectPath(role: UserRole | string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/platform';
    case 'ADMIN':
      return '/live-ops';
    case 'KITCHEN_STAFF':
      return '/kitchen-home';
    case 'WAITER':
      return '/waiter-home';
    default:
      return '/live-ops';
  }
}

/** Local-storage key for persisted user profile (non-sensitive). */
export const USER_STORAGE_KEY = 'auth-user';

/** Local-storage key for persisted restaurant info (non-sensitive). */
export const RESTAURANT_STORAGE_KEY = 'auth-restaurant';

/** Local-storage key for persisted access token. */
export const TOKEN_STORAGE_KEY = 'auth-token';

/** Local-storage key for persisted refresh token fallback. */
export const REFRESH_TOKEN_STORAGE_KEY = 'auth-refresh-token';

/** Local-storage key for persisted current active branch. */
export const CURRENT_BRANCH_STORAGE_KEY = 'auth-current-branch';

/** Local-storage key for persisted accessible branches. */
export const ACCESSIBLE_BRANCHES_STORAGE_KEY = 'auth-accessible-branches';
