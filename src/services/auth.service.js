"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";
import { normalizeUser, absoluteUploadUrl } from "./normalize";

/** Split a single "Full Name" field into the backend's firstName / lastName. */
function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ") || firstName; // backend requires a last name
  return { firstName, lastName };
}

/** Normalize the `{ user, accessToken, refreshToken }` auth payload. */
function normalizeAuth(data) {
  if (!data) return data;
  return data.user ? { ...data, user: normalizeUser(data.user) } : data;
}

export const authService = {
  async login(credentials) {
    return normalizeAuth(unwrap(await api.post(ENDPOINTS.auth.login, credentials)));
  },

  async register({ name, acceptTerms, ...rest }) {
    const payload = { ...splitName(name), ...rest };
    return normalizeAuth(unwrap(await api.post(ENDPOINTS.auth.register, payload)));
  },

  async logout() {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } catch {
      // Best-effort: local session is cleared regardless.
    }
  },

  async forgotPassword(payload) {
    return unwrap(await api.post(ENDPOINTS.auth.forgotPassword, payload));
  },

  async resetPassword(payload) {
    return unwrap(await api.post(ENDPOINTS.auth.resetPassword, payload));
  },

  async verifyEmail(token) {
    return unwrap(await api.post(ENDPOINTS.auth.verifyEmail, { token }));
  },

  async changePassword(payload) {
    return unwrap(await api.post(ENDPOINTS.auth.changePassword, payload));
  },

  async getProfile({ signal } = {}) {
    return normalizeUser(unwrap(await api.get(ENDPOINTS.auth.me, { signal })));
  },

  async updateProfile({ name, ...rest }) {
    const payload = name ? { ...splitName(name), ...rest } : rest;
    return normalizeUser(unwrap(await api.put(ENDPOINTS.auth.profile, payload)));
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);
    const data = unwrap(
      await api.post(ENDPOINTS.auth.avatar, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
    const url = data?.avatarUrl || data?.user?.avatarUrl || data?.avatar;
    return { avatar: absoluteUploadUrl(url) };
  },
};
