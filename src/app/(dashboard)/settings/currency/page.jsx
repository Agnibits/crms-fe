"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import { FormInput, FormNumber, FormSelect } from "@/components/forms/fields";
import { currencySchema } from "@/validations/settings.schema";
import { useSetting, useUpdateSetting } from "@/features/settings/hooks";
import { useSettingsStore } from "@/store/settings.store";
import { formatCurrency } from "@/utils/format";

const CODES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
];
const POSITIONS = [
  { value: "before", label: "Before amount ($100)" },
  { value: "after", label: "After amount (100$)" },
];

export default function CurrencySettingsPage() {
  const { data, isPending, error, refetch } = useSetting("currency");
  const setSettings = useSettingsStore((s) => s.setSettings);
  const update = useUpdateSetting("currency", {
    onSuccess: (_data, variables) => setSettings({ currency: variables.code }),
  });

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(currencySchema),
    values: {
      code: data?.code || "USD",
      symbol: data?.symbol || "$",
      position: data?.position || "before",
      decimals: data?.decimals ?? 2,
    },
  });

  const code = watch("code");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Currency</CardTitle>
        <CardDescription>Set the currency used across quotes, invoices and reports.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => update.mutate(values))} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect control={control} name="code" label="Currency" options={CODES} error={errors.code} required />
              <FormInput register={register} name="symbol" label="Symbol" error={errors.symbol} required />
              <FormSelect control={control} name="position" label="Symbol position" options={POSITIONS} error={errors.position} required />
              <FormNumber register={register} name="decimals" label="Decimal places" error={errors.decimals} required min={0} max={3} />
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              Preview: <span className="font-medium">{formatCurrency(1234.5, code || "USD")}</span>
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={update.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
