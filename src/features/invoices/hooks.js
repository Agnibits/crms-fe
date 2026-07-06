"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { invoiceService } from "@/services/invoice.service";
import { QUERY_KEYS } from "@/constants/app";

export const invoiceHooks = createCrudHooks({
  key: QUERY_KEYS.invoices,
  service: invoiceService,
  label: "Invoice",
});
