"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Task CRUD service. assigneeId→assignedUserId; status/priority enums cased;
 * the form's boolean "reminder" has no column (backend uses reminderAt).
 */
const base = createCrudService(ENDPOINTS.tasks);
const mapper = makeMapper({
  rename: { assigneeId: "assignedUserId" },
  enums: ["status", "priority"],
  allow: [
    "title", "description", "priority", "status", "dueDate", "reminderAt",
    "assignedUserId", "relatedType", "relatedId",
  ],
});

export const taskService = withMapping(base, mapper);
