"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const current = get().theme;
        const isDark =
          current === "dark" ||
          (current === "system" &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        get().setTheme(isDark ? "light" : "dark");
      },
      /** Re-apply persisted theme on first client render. */
      hydrate: () => applyTheme(get().theme),
    }),
    { name: "crm-theme", storage: createJSONStorage(() => localStorage) }
  )
);
