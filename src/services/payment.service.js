"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Payment CRUD service. method enum cased (bank_transfer/cheque→BANK);
 * the form's "paidAt" has no create column.
 */
const base = createCrudService(ENDPOINTS.payments);
// Drops number/invoiceNumber/customerId/customerName/status the dialog rides along;
// paidAt is kept so a back-dated payment date reaches the backend.
const mapper = makeMapper({
  enums: ["method"],
  allow: ["invoiceId", "amount", "method", "currency", "reference", "notes", "paidAt"],
});

export const paymentService = withMapping(base, mapper);
