"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { activityService } from "@/services/activity.service";
import { QUERY_KEYS } from "@/constants/app";

export const activityHooks = createCrudHooks({
  key: QUERY_KEYS.activities,
  service: activityService,
  label: "Activity",
});
