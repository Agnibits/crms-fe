"use client";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

export const productService = {
  ...createCrudService(ENDPOINTS.products),
};
