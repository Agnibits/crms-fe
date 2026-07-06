"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { dealService } from "@/services/deal.service";
import { QUERY_KEYS } from "@/constants/app";

export const dealHooks = createCrudHooks({
  key: QUERY_KEYS.deals,
  service: dealService,
  label: "Deal",
});
