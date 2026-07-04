export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_STORAGE_KEY = "steward_csrf_token";

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

export function setCsrfToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CSRF_STORAGE_KEY, token);
  }
}

export function getCsrfHeader(): Record<string, string> {
  const token = readCookie(CSRF_COOKIE_NAME) || (typeof window !== "undefined" ? localStorage.getItem(CSRF_STORAGE_KEY) : null);
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

