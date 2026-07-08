"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

/** Email templates CRUD — fields: name, subject, body, isActive. */
export const emailTemplateService = createCrudService(ENDPOINTS.emailTemplates);
