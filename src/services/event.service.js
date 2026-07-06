"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

export const eventService = {
  ...createCrudService(ENDPOINTS.events),
};
