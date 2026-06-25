import axios from "axios";
import { getCsrfHeader } from "@/lib/auth/csrf";
import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth.store";



export const api = axios.create({
  baseURL: API_BASE_URL,
  /**
   * withCredentials: true
   *
   * Required for the httpOnly refreshToken cookie to be included in every
   * request sent by this axios instance. Without it the browser strips all
   * cookies from cross-origin requests and the silent-refresh flow breaks.
   *
   * CORS dependency: the backend must respond with:
   *   Access-Control-Allow-Origin: <exact origin>   (not *)
   *   Access-Control-Allow-Credentials: true
   */
  withCredentials: true,
});

// ── Request interceptor: attach in-memory access token ───────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  Object.assign(config.headers, getCsrfHeader());
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ── Response interceptor: silent token refresh on 401 ────────────────────────
//
// Uses the shared silentRefresh() singleton from lib/auth/refresh so that the
// 401 retry path and the cold-start recovery path in useRequireAuth share one
// deduplication mechanism — only one /auth/refresh call ever runs at a time.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isPublicAuthEndpoint =
      originalRequest.url &&
      (originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/staff-login') ||
        originalRequest.url.includes('/auth/exchange') ||
        originalRequest.url.includes('/auth/refresh') ||
        originalRequest.url.includes('/auth/owner-register') ||
        originalRequest.url.includes('/auth/forgot-password') ||
        originalRequest.url.includes('/auth/reset-password') ||
        originalRequest.url.includes('/auth/resend-verification') ||
        originalRequest.url.includes('/auth/verify-email') ||
        originalRequest.url.includes('/auth/google'));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Dynamic import avoids a circular dependency at module initialisation
      // (refresh.ts imports useAuthStore which imports nothing from axios.ts).
      const { silentRefresh } = await import('@/lib/auth/refresh');

      return new Promise((resolve, reject) => {
        silentRefresh()
          .then((payload) => {
            const newToken = payload.accessToken;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            const refreshStatus = (err as any)?.response?.status;
            if (refreshStatus === 401 || refreshStatus === 403) {
              // Server explicitly rejected the refresh token — force re-login.
              // No response (network error) → leave the user alone.
              useAuthStore.getState().clearAuth();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  },
);

export default api;
