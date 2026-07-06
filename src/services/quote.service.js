"use client";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

const crud = createCrudService(ENDPOINTS.quotes);

export const quoteService = {
  ...crud,
  /** Convert an accepted quote into a sales order. */
  convertToOrder: (id, payload = {}) => crud.action(id, "convert-to-order", payload),
};
