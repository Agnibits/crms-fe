"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Ticket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea, FormSelect } from "@/components/forms/fields";
import { ticketHooks, useAgents } from "@/features/tickets/hooks";
import { useDepartmentOptions } from "@/features/departments/hooks";
import { createCrudService } from "@/services/crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { QUERY_KEYS } from "@/constants/app";
import { PRIORITIES } from "@/constants/options";

const customerCrud = createCrudService(ENDPOINTS.customers);

const schema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().optional(),
  customerId: z.string().optional(),
  priority: z.string().optional(),
  assignedUserId: z.string().optional(),
  departmentId: z.string().optional(),
});

/** Raise a new support ticket (agent-created, e.g. phone/walk-in requests). */
export default function NewTicketDialog({ open, onOpenChange }) {
  const create = ticketHooks.useCreate();
  const agents = useAgents();
  const { options: departmentOptions, hasDepartments } = useDepartmentOptions();
  const customers = useQuery({
    queryKey: [...QUERY_KEYS.customers, "list", { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }],
    queryFn: ({ signal }) =>
      customerCrud.list({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }, { signal }),
    enabled: open,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      description: "",
      customerId: "",
      priority: "medium",
      assignedUserId: "",
      departmentId: "",
    },
  });

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = (values) => create.mutate(values, { onSuccess: close });

  const customerOptions = (customers.data?.items ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const agentOptions = (agents.data?.items ?? []).map((u) => ({
    value: u.id,
    label: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New support ticket</DialogTitle>
          <DialogDescription>Log a customer support request for your team to resolve.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormInput
            register={register}
            name="subject"
            label="Subject"
            placeholder="e.g. Unable to log in to the portal"
            required
            error={errors.subject}
          />
          <FormTextarea
            register={register}
            name="description"
            label="Description"
            rows={4}
            placeholder="What is the customer experiencing?"
            error={errors.description}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              control={control}
              name="customerId"
              label="Customer"
              options={customerOptions}
              placeholder={customers.isPending ? "Loading…" : "Select a customer"}
              error={errors.customerId}
            />
            <FormSelect
              control={control}
              name="priority"
              label="Priority"
              options={PRIORITIES}
              placeholder="Priority"
              error={errors.priority}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              control={control}
              name="assignedUserId"
              label="Assign to"
              options={agentOptions}
              placeholder="Unassigned"
              error={errors.assignedUserId}
            />
            {hasDepartments && (
              <FormSelect
                control={control}
                name="departmentId"
                label="Department"
                options={departmentOptions}
                placeholder="Route to department"
                error={errors.departmentId}
              />
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={close} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              Create ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
