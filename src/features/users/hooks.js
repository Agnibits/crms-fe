"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { userService } from "@/services/user.service";
import { QUERY_KEYS } from "@/constants/app";

export const userHooks = createCrudHooks({
  key: QUERY_KEYS.users,
  service: userService,
  label: "User",
});
