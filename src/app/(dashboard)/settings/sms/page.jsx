"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import { FormInput, FormSelect, FormSwitch } from "@/components/forms/fields";
import { smsSettingsSchema } from "@/validations/settings.schema";
import { useSetting, useUpdateSetting } from "@/features/settings/hooks";

/**
 * Nepali gateways lead the list — they are what a company here actually buys.
 * Twilio and Vonage remain for companies already on them.
 */
const PROVIDERS = [
  { value: "sparrow", label: "Sparrow SMS (Nepal)" },
  { value: "aakash", label: "Aakash SMS (Nepal)" },
  { value: "ntc", label: "Nepal Telecom bulk SMS" },
  { value: "ncell", label: "Ncell bulk SMS" },
  { value: "twilio", label: "Twilio (international)" },
  { value: "vonage", label: "Vonage (international)" },
  { value: "msg91", label: "MSG91 (India)" },
];

export default function SmsSettingsPage() {
  const { data, isPending, error, refetch } = useSetting("sms");
  const update = useUpdateSetting("sms");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(smsSettingsSchema),
    values: {
      provider: data?.provider || "sparrow",
      senderId: data?.senderId || "",
      enabled: data?.enabled ?? true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SMS Settings</CardTitle>
        <CardDescription>
          Choose the gateway your company uses and save its sender ID here.
        </CardDescription>
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
            {/* Said plainly, above the form: nothing here sends a message yet.
                A settings screen that looks finished is how someone comes to
                rely on one that isn't. */}
            <div className="flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div className="text-sm">
                <p className="font-medium">Not connected yet — no SMS is sent</p>
                <p className="mt-0.5 text-muted-foreground">
                  Your choice is saved so it is ready when the gateway is wired up, but the CRM does
                  not send text messages today. Use email for anything a customer must receive.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                control={control}
                name="provider"
                label="Provider"
                options={PROVIDERS}
                error={errors.provider}
                required
              />
              <FormInput
                register={register}
                name="senderId"
                label="Sender ID"
                placeholder="e.g. AGNIBITS or 9779XXXXX"
                hint="The name or shortcode your gateway approved for you."
                error={errors.senderId}
                required
              />
            </div>
            <FormSwitch
              control={control}
              name="enabled"
              label="Enable SMS"
              hint="Turn off to pause all outgoing SMS once the gateway is connected."
              error={errors.enabled}
            />
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
