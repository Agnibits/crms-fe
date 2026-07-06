"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/** Order CRUD service. status enum cased (shipped→PROCESSING, delivered→COMPLETED). */
const base = createCrudService(ENDPOINTS.orders);

export const orderService = withMapping(
  base,
  makeMapper({
    enums: ["status"],
    allow: ["customerId", "quoteId", "currency", "status", "discount", "tax", "items"],
  })
);
