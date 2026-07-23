"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { opportunityService } from "@/services/opportunity.service";
import { QUERY_KEYS } from "@/constants/app";

export const opportunityHooks = createCrudHooks({
  key: QUERY_KEYS.opportunities,
  service: opportunityService,
  label: "Deal",
});
