"use client";

import axios from "axios";
import toast from "react-hot-toast";
import { API_URL, USE_MOCK } from "@/constants/app";
import { ENDPOINTS } from "@/constants/endpoints";
import { tokenStorage } from "@/utils/storage";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// In mock mode every request is served by the in-browser adapter.
if (USE_MOCK && typeof window !== "undefined") {
  import("./mock/mockAdapter").then(({ mockAdapter }) => {
    api.defaults.adapter = mockAdapter;
  });
}

/* ── Request: attach access token ─────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response: auto token refresh with a waiter queue ─────────── */
let isRefreshing = false;
let refreshWaiters = [];

function onTokenRefreshed(newToken) {
  refreshWaiters.forEach((cb) => cb(newToken));
  refreshWaiters = [];
}

function forceLogout() {
  tokenStorage.clear();
  // Lazy import to avoid a cycle (store → storage only).
  import("@/store/auth.store").then(({ useAuthStore }) => {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  });
}

const AUTH_PATHS = [ENDPOINTS.auth.login, ENDPOINTS.auth.register, ENDPOINTS.auth.refresh];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Request was cancelled (React Query abort) — propagate silently.
    if (axios.isCancel(error)) return Promise.reject(error);

    /* Retry idempotent GETs on network errors / gateway hiccups. */
    if (
      config &&
      config.method === "get" &&
      (!response || [502, 503, 504].includes(response.status)) &&
      (config.__retryCount || 0) < 2
    ) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      await new Promise((r) => setTimeout(r, 400 * 2 ** config.__retryCount));
      return api(config);
    }

    /* 401 → refresh token flow (except for auth endpoints themselves). */
    if (
      response?.status === 401 &&
      config &&
      !config.__isRetryAfterRefresh &&
      !AUTH_PATHS.some((p) => config.url?.includes(p))
    ) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for the in-flight refresh, then replay this request.
        return new Promise((resolve, reject) => {
          refreshWaiters.push((newToken) => {
            if (!newToken) return reject(error);
            config.headers.Authorization = `Bearer ${newToken}`;
            config.__isRetryAfterRefresh = true;
            resolve(api(config));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await api.post(ENDPOINTS.auth.refresh, { refreshToken });
        const payload = data?.data || data;
        tokenStorage.setTokens({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken || refreshToken,
        });
        onTokenRefreshed(payload.accessToken);
        config.headers.Authorization = `Bearer ${payload.accessToken}`;
        config.__isRetryAfterRefresh = true;
        return api(config);
      } catch (refreshError) {
        onTokenRefreshed(null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/* ── Helpers ──────────────────────────────────────────────────── */

/** Extract a human-readable message from an API error. */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (axios.isCancel(error)) return null;
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error?.code === "ECONNABORTED" && "Request timed out.") ||
    (error?.message === "Network Error" && "Cannot reach the server. Check your connection.") ||
    error?.message ||
    fallback
  );
}

/** Toast an API error (skips cancelled requests). */
export function toastError(error, fallback) {
  const message = getErrorMessage(error, fallback);
  if (message) toast.error(message);
}

/** Unwrap the standard `{ success, message, data }` envelope. */
export function unwrap(response) {
  const body = response?.data;
  return body?.data !== undefined ? body.data : body;
}

/** Create an AbortController pair for cancellable imperative requests. */
export function withCancel() {
  const controller = new AbortController();
  return { signal: controller.signal, cancel: () => controller.abort() };
}
