"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

export const dealService = {
  ...createCrudService(ENDPOINTS.deals),
};
