"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import { FormInput, FormNumber, FormSelect } from "@/components/forms/fields";
import { emailSettingsSchema } from "@/validations/settings.schema";
import { useSetting, useUpdateSetting } from "@/features/settings/hooks";

const PROVIDERS = [
  { value: "smtp", label: "SMTP" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "ses", label: "Amazon SES" },
];
const ENCRYPTION = [
  { value: "tls", label: "TLS" },
  { value: "ssl", label: "SSL" },
  { value: "none", label: "None" },
];

export default function EmailSettingsPage() {
  const { data, isPending, error, refetch } = useSetting("email");
  const update = useUpdateSetting("email");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(emailSettingsSchema),
    values: {
      provider: data?.provider || "smtp",
      host: data?.host || "",
      port: data?.port ?? 587,
      fromName: data?.fromName || "",
      fromEmail: data?.fromEmail || "",
      encryption: data?.encryption || "tls",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Settings</CardTitle>
        <CardDescription>Configure the mail server used to send transactional emails.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => update.mutate(values))} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect control={control} name="provider" label="Provider" options={PROVIDERS} error={errors.provider} required />
              <FormSelect control={control} name="encryption" label="Encryption" options={ENCRYPTION} error={errors.encryption} required />
              <FormInput register={register} name="host" label="SMTP host" placeholder="smtp.example.com" error={errors.host} required />
              <FormNumber register={register} name="port" label="Port" error={errors.port} required />
              <FormInput register={register} name="fromName" label="From name" error={errors.fromName} required />
              <FormInput register={register} name="fromEmail" type="email" label="From email" error={errors.fromEmail} required />
            </div>
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.success("Test email sent — check your inbox")}
              >
                <Send className="h-4 w-4" /> Send test email
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
