export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: 'Google sign-in was cancelled.',
  staff_not_found: 'No staff account found for this Google email. Please ask your manager to add you.',
  role_mismatch: 'This Google account is not linked to a staff role.',
  admin_role_forbidden: 'Staff accounts must use the Staff login tab.',
  account_deactivated: 'Your account has been deactivated. Please contact support.',
  invalid_state: 'Authentication security check failed. Please try again.',
  invalid_exchange: 'Sign-in session expired or invalid. Please try again.',
  oauth_expired: 'Sign-in session expired. Please try again.',
  oauth_disabled: 'Google sign-in is currently disabled on this server.',
  oauth_failed: 'Google sign-in failed. Please try again.',
};

export function getOAuthErrorMessage(errorCode: string | null): string {
  if (!errorCode) return OAUTH_ERROR_MESSAGES.oauth_failed;
  return OAUTH_ERROR_MESSAGES[errorCode] || OAUTH_ERROR_MESSAGES.oauth_failed;
}
