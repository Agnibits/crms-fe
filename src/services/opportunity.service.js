"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

export const opportunityService = {
  ...createCrudService(ENDPOINTS.opportunities),
};
