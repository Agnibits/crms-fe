"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/** Support ticket CRUD service. status/priority enums cased. */
const base = createCrudService(ENDPOINTS.tickets);

const inner = makeMapper({
  enums: ["status", "priority"],
  allow: ["subject", "description", "priority", "status", "customerId", "assignedUserId", "departmentId"],
  nullable: ["departmentId"],
});

const mapper = {
  toBackend: inner.toBackend,
  // The list/detail carry ticketNumber + nested customer/assignee + a message
  // thread; flatten them into the flat shape the table, detail and chat read.
  fromBackend(t) {
    if (!t || typeof t !== "object") return t;
    return {
      ...inner.fromBackend(t),
      number: t.ticketNumber ?? t.number ?? "",
      customerId: t.customerId ?? t.customer?.id ?? null,
      customerName: t.customer?.name ?? t.customerName ?? "",
      assigneeId: t.assignedUserId ?? t.assigneeId ?? null,
      messages: (t.messages ?? []).map((m) => {
        const fromCustomer = String(m.sender ?? "AGENT").toUpperCase() === "CUSTOMER";
        return {
          id: m.id,
          from: fromCustomer ? "customer" : "agent",
          author:
            m.authorName ||
            (fromCustomer ? t.customer?.name ?? "Customer" : "Support Agent"),
          body: m.body,
          createdAt: m.createdAt,
        };
      }),
    };
  },
};

export const ticketService = {
  ...withMapping(base, mapper),
  // GET /tickets/:id omits the message thread — /detail includes it. The
  // ticket's own description is the customer's original request, so surface it
  // as the first message in the thread (it isn't shown anywhere else).
  getById: async (id, opts) => {
    const t = mapper.fromBackend(await base.sub(id, "detail", {}, opts));
    if (t?.description) {
      t.messages = [
        {
          id: `desc-${t.id}`,
          from: "customer",
          author: t.customerName || "Customer",
          body: t.description,
          createdAt: t.createdAt,
        },
        ...(t.messages ?? []),
      ];
    }
    return t;
  },
  /** Post a reply on the ticket thread: POST /tickets/:id/messages */
  reply: (id, payload) => base.action(id, "messages", payload),
};
