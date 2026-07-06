"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { leadService } from "@/services/lead.service";
import { QUERY_KEYS } from "@/constants/app";

export const leadHooks = createCrudHooks({
  key: QUERY_KEYS.leads,
  service: leadService,
  label: "Lead",
});
