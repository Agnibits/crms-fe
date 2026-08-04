"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { FormNumber } from "@/components/forms/fields";
import { taxSchema } from "@/validations/settings.schema";
import { useSetting, useUpdateSetting } from "@/features/settings/hooks";

let tempId = 0;

// Nepal-first presets. VAT at 13% is the standard rate almost every registered
// business charges; "VAT Exempt" (0%) covers basic goods/services that the Act
// zero-rates. One click beats making every user remember and type the rate.
const NEPAL_TAX_PRESETS = [
  { name: "VAT", rate: 13 },
  { name: "VAT Exempt", rate: 0 },
];
const NEPAL_VAT_RATE = 13;

export default function TaxSettingsPage() {
  const { data, isPending, error, refetch } = useSetting("tax");
  const update = useUpdateSetting("tax");
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    if (data?.taxes) setTaxes(data.taxes.map((t) => ({ ...t })));
  }, [data]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taxSchema),
    // Default to Nepal VAT for a fresh setup; a saved 0 is respected (0 ?? 13 = 0).
    values: { defaultRate: data?.defaultRate ?? NEPAL_VAT_RATE },
  });

  const addTax = () => setTaxes((prev) => [...prev, { id: `new-${tempId++}`, name: "", rate: 0 }]);
  /** Add a named preset, skipping it if a row with that name already exists. */
  const addPreset = ({ name, rate }) =>
    setTaxes((prev) =>
      prev.some((t) => t.name.trim().toLowerCase() === name.toLowerCase())
        ? prev
        : [...prev, { id: `new-${tempId++}`, name, rate }]
    );
  const removeTax = (id) => setTaxes((prev) => prev.filter((t) => t.id !== id));
  const patchTax = (id, patch) =>
    setTaxes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const onSubmit = (values) => {
    const cleaned = taxes
      .filter((t) => t.name.trim())
      .map((t) => ({ id: t.id, name: t.name.trim(), rate: Number(t.rate) || 0 }));
    update.mutate({ defaultRate: values.defaultRate, taxes: cleaned });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax Settings</CardTitle>
        <CardDescription>Set the default tax rate and manage named tax rates.</CardDescription>
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
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div className="max-w-xs">
              <FormNumber
                register={register}
                name="defaultRate"
                label="Default tax rate (%)"
                error={errors.defaultRate}
                hint="Nepal's standard VAT rate is 13%."
                required
              />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Tax rates</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {NEPAL_TAX_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addPreset(preset)}
                    >
                      <Plus className="h-4 w-4" /> {preset.name} {preset.rate}%
                    </Button>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={addTax}>
                    <Plus className="h-4 w-4" /> Custom
                  </Button>
                </div>
              </div>
              {taxes.length === 0 ? (
                <EmptyState
                  title="No tax rates"
                  description="Nepal's standard VAT is 13%. Add it in one click, or create a custom rate."
                  actionLabel="Add VAT (13%)"
                  onAction={() => addPreset({ name: "VAT", rate: NEPAL_VAT_RATE })}
                  className="py-8"
                />
              ) : (
                <div className="space-y-2">
                  {taxes.map((tax) => (
                    <div key={tax.id} className="flex items-center gap-2">
                      <Input
                        value={tax.name}
                        onChange={(e) => patchTax(tax.id, { name: e.target.value })}
                        placeholder="Tax name (e.g. VAT)"
                        className="flex-1"
                        aria-label="Tax name"
                      />
                      <div className="relative w-28">
                        <Input
                          type="number"
                          step="any"
                          value={tax.rate}
                          onChange={(e) => patchTax(tax.id, { rate: e.target.value })}
                          className="pr-7"
                          aria-label="Tax rate"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeTax(tax.id)}
                        aria-label="Remove tax"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={update.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
