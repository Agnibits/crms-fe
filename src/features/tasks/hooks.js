"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { taskService } from "@/services/task.service";
import { QUERY_KEYS } from "@/constants/app";

export const taskHooks = createCrudHooks({
  key: QUERY_KEYS.tasks,
  service: taskService,
  label: "Task",
});
