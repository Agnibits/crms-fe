"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useUiStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      commandOpen: false,

      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    {
      name: "crm-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
