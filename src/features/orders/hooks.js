"use client";
import { createCrudHooks } from "@/hooks/useCrud";
import { orderService } from "@/services/order.service";
import { QUERY_KEYS } from "@/constants/app";

export const orderHooks = createCrudHooks({
  key: QUERY_KEYS.orders,
  service: orderService,
  label: "Order",
});
