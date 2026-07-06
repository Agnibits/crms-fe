"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tokenStorage } from "@/utils/storage";
import { ROLE_PERMISSIONS } from "@/constants/roles";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      /** Called after login / register / profile fetch. */
      setAuth: ({ user, accessToken, refreshToken }) => {
        if (accessToken || refreshToken) {
          tokenStorage.setTokens({ accessToken, refreshToken });
        }
        set({ user, isAuthenticated: true });
      },

      updateUser: (patch) => set({ user: { ...get().user, ...patch } }),

      logout: () => {
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false });
      },

      hasRole: (...roles) => {
        const role = get().user?.role;
        return !!role && roles.flat().includes(role);
      },

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        const permissions = user.permissions?.length
          ? user.permissions
          : ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes(permission);
      },
    }),
    {
      name: "crm-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
