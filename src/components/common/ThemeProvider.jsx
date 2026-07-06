"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

/** Applies the persisted theme class on mount and reacts to system changes. */
export function ThemeProvider({ children }) {
  const theme = useThemeStore((s) => s.theme);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => hydrate();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme, hydrate]);

  return children;
}
