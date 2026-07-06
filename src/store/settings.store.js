"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_CURRENCY } from "@/constants/app";

/** Global org-level settings cached client-side (currency, locale, tax…). */
export const useSettingsStore = create(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY,
      locale: "en-US",
      dateFormat: "MMM d, yyyy",
      taxRate: 0,
      companyName: "",
      setSettings: (patch) => set(patch),
    }),
    { name: "crm-settings", storage: createJSONStorage(() => localStorage) }
  )
);
