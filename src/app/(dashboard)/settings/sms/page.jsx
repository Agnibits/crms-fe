"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import { FormInput, FormSelect, FormSwitch } from "@/components/forms/fields";
import { smsSettingsSchema } from "@/validations/settings.schema";
import { useSetting, useUpdateSetting } from "@/features/settings/hooks";

const PROVIDERS = [
  { value: "twilio", label: "Twilio" },
  { value: "msg91", label: "MSG91" },
  { value: "vonage", label: "Vonage" },
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
      provider: data?.provider || "twilio",
      senderId: data?.senderId || "",
      enabled: data?.enabled ?? true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SMS Settings</CardTitle>
        <CardDescription>Configure the gateway used to send SMS notifications and campaigns.</CardDescription>
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
              <FormSelect control={control} name="provider" label="Provider" options={PROVIDERS} error={errors.provider} required />
              <FormInput register={register} name="senderId" label="Sender ID" placeholder="e.g. AGNIBT" error={errors.senderId} required />
            </div>
            <FormSwitch control={control} name="enabled" label="Enable SMS" hint="Turn off to pause all outgoing SMS." error={errors.enabled} />
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => toast.success("Test SMS sent")}>
                <Send className="h-4 w-4" /> Send test SMS
              </Button>
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
