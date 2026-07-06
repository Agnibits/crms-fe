"use client";

import { API_URL } from "@/constants/app";
import { ROLES } from "@/constants/roles";

/**
 * Adapters between the backend API contract and the shapes the frontend
 * (built against the mock adapter) expects. Kept in one place so the rest of
 * the app — stores, hooks, components — stays unaware of the backend's naming.
 */

// Origin that serves static uploads (avatars, files): the API host without /api/v1.
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "";
  }
})();

/** Backend Role enum → frontend role id used by RBAC / nav. */
const ROLE_MAP = {
  SUPER_ADMIN: ROLES.ADMIN,
  ADMIN: ROLES.ADMIN,
  MANAGER: ROLES.MANAGER,
  SALES_MANAGER: ROLES.MANAGER,
  SALES_EXECUTIVE: ROLES.SALES,
  MARKETING: ROLES.SALES,
  CUSTOMER_SUPPORT: ROLES.SUPPORT,
  USER: ROLES.USER,
};

/** Frontend role id → backend Role enum (for writes, e.g. user management). */
const ROLE_MAP_REVERSE = {
  [ROLES.ADMIN]: "ADMIN",
  [ROLES.MANAGER]: "MANAGER",
  [ROLES.SALES]: "SALES_EXECUTIVE",
  [ROLES.SUPPORT]: "CUSTOMER_SUPPORT",
  [ROLES.USER]: "USER",
};

export function toBackendRole(role) {
  if (!role) return role;
  return ROLE_MAP_REVERSE[role] || String(role).toUpperCase();
}

/** Turn a possibly-relative upload path into an absolute URL. */
export function absoluteUploadUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Backend user → frontend user.
 * Backend: { firstName, lastName, avatarUrl, role: "SUPER_ADMIN", ... }
 * Frontend expects: { name, avatar, role: "admin", ... }
 */
export function normalizeUser(u) {
  if (!u || typeof u !== "object") return u;
  const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return {
    ...u,
    name: u.name || fullName || u.email || "",
    avatar: absoluteUploadUrl(u.avatar || u.avatarUrl) || null,
    role: ROLE_MAP[u.role] || (u.role ? String(u.role).toLowerCase() : ROLES.USER),
    rawRole: u.role,
    status: u.status ? String(u.status).toLowerCase() : u.status,
  };
}

/**
 * Backend list envelope → frontend list shape.
 * Backend: response body { data: [...], meta: { pagination: { page, limit, total, totalPages, ... } } }
 * Mock:    response body { data: { items, page, limit, total, totalPages } }
 * Frontend list pages/hooks expect: { items, page, limit, total, totalPages, hasNextPage, hasPrevPage }
 */
export function normalizeList(response) {
  const body = response?.data;
  const inner = body?.data !== undefined ? body.data : body;

  // Already in the frontend shape (mock adapter, or a non-list payload).
  if (inner && !Array.isArray(inner) && Array.isArray(inner.items)) return inner;

  if (Array.isArray(inner)) {
    const p = body?.meta?.pagination || body?.pagination || {};
    return {
      items: inner,
      page: p.page ?? 1,
      limit: p.limit ?? inner.length,
      total: p.total ?? inner.length,
      totalPages: p.totalPages ?? 1,
      hasNextPage: p.hasNextPage ?? false,
      hasPrevPage: p.hasPrevPage ?? false,
    };
  }

  // Fallback: not a recognisable list — hand back whatever we got.
  return inner;
}
