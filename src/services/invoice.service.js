"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/** Invoice CRUD service. status enum cased (void→CANCELLED). */
const base = createCrudService(ENDPOINTS.invoices);

export const invoiceService = {
  ...withMapping(
    base,
    makeMapper({
      enums: ["status"],
      allow: ["customerId", "orderId", "dueDate", "currency", "status", "discount", "tax", "items"],
    })
  ),
  // POST /invoices/:id/send — email the invoice to the customer
  send: (id, payload) => base.action(id, "send", payload),
};
