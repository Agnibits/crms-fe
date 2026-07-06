"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

export const authService = {
  async login(credentials) {
    return unwrap(await api.post(ENDPOINTS.auth.login, credentials));
  },

  async register(payload) {
    return unwrap(await api.post(ENDPOINTS.auth.register, payload));
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
    return unwrap(await api.get(ENDPOINTS.auth.me, { signal }));
  },

  async updateProfile(payload) {
    return unwrap(await api.put(ENDPOINTS.auth.profile, payload));
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);
    return unwrap(
      await api.post(ENDPOINTS.auth.avatar, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },
};
