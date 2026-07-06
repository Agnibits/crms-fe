"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { paymentService } from "@/services/payment.service";
import { QUERY_KEYS } from "@/constants/app";

export const paymentHooks = createCrudHooks({
  key: QUERY_KEYS.payments,
  service: paymentService,
  label: "Payment",
});
