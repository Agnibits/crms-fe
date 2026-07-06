"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

export const invoiceService = {
  ...createCrudService(ENDPOINTS.invoices),
  // POST /invoices/:id/send — email the invoice to the customer
  send: (id, payload) => createCrudService(ENDPOINTS.invoices).action(id, "send", payload),
};
