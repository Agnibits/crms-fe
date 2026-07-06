"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FormDatePicker,
  FormInput,
  FormNumber,
  FormSelect,
} from "@/components/forms/fields";
import { paymentHooks } from "@/features/payments/hooks";
import { invoiceHooks } from "@/features/invoices/hooks";
import { paymentSchema } from "@/validations/payment.schema";
import { PAYMENT_METHODS } from "@/constants/options";
import { QUERY_KEYS } from "@/constants/app";
import { formatCurrency } from "@/utils/format";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Dialog to record a payment against an invoice.
 * Pass `invoiceId` to pre-select an invoice (e.g. from the invoice detail page).
 */
export default function RecordPaymentDialog({ open, onOpenChange, invoiceId = "" }) {
  const queryClient = useQueryClient();
  const create = paymentHooks.useCreate();

  // Open invoices to pick from (only fetched while the dialog is open).
  const invoicesQuery = invoiceHooks.useList({ limit: 100 }, { enabled: open });
  const invoices = invoicesQuery.data?.items ?? [];

  const invoiceOptions = useMemo(
    () =>
      invoices.map((inv) => ({
        value: inv.id,
        label: `${inv.number} — ${inv.customerName} — ${formatCurrency(inv.balance)}`,
      })),
    [invoices]
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: invoiceId || "",
      amount: undefined,
      method: "",
      reference: "",
      paidAt: today(),
    },
  });

  const selectedInvoiceId = watch("invoiceId");
  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  // Reset the form each time the dialog opens (respecting a pre-selected invoice).
  useEffect(() => {
    if (open) {
      reset({
        invoiceId: invoiceId || "",
        amount: undefined,
        method: "",
        reference: "",
        paidAt: today(),
      });
    }
  }, [open, invoiceId, reset]);

  // Default the amount to the remaining balance of the selected invoice.
  useEffect(() => {
    if (selectedInvoice) {
      setValue("amount", selectedInvoice.balance ?? 0, { shouldValidate: false });
    }
  }, [selectedInvoiceId, selectedInvoice, setValue]);

  const onSubmit = (values) => {
    const invoice = invoices.find((inv) => inv.id === values.invoiceId);
    create.mutate(
      {
        ...values,
        paidAt: new Date(values.paidAt).toISOString(),
        number: `PAY-${Date.now().toString().slice(-6)}`,
        invoiceNumber: invoice?.number ?? "",
        customerId: invoice?.customerId ?? "",
        customerName: invoice?.customerName ?? "",
        status: "completed",
      },
      {
        onSuccess: () => {
          // Payments key is invalidated by the hook; also refresh invoices
          // so balances / statuses reflect the new payment.
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Log a payment received against an outstanding invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSelect
            control={control}
            name="invoiceId"
            label="Invoice"
            required
            options={invoiceOptions}
            placeholder={invoicesQuery.isPending ? "Loading invoices…" : "Select an invoice"}
            error={errors.invoiceId}
            disabled={!!invoiceId}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormNumber
              register={register}
              name="amount"
              label="Amount"
              required
              min="0"
              error={errors.amount}
              hint={
                selectedInvoice
                  ? `Remaining balance: ${formatCurrency(selectedInvoice.balance)}`
                  : undefined
              }
            />
            <FormSelect
              control={control}
              name="method"
              label="Method"
              required
              options={PAYMENT_METHODS}
              placeholder="Payment method"
              error={errors.method}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              register={register}
              name="reference"
              label="Reference"
              placeholder="e.g. TXN123456"
              error={errors.reference}
            />
            <FormDatePicker
              register={register}
              name="paidAt"
              label="Payment Date"
              required
              error={errors.paidAt}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
