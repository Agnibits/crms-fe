"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Plug, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { FormInput, FormNumber, FormSwitch } from "@/components/forms/fields";
import { emailChannelSchema } from "@/validations/emailChannel.schema";
import {
  useEmailChannels,
  useConnectChannel,
  useTestChannel,
  useDeleteChannel,
} from "@/features/email/hooks";

function ConnectedChannel({ channel, onTest, onDelete, testing }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            {channel.fromEmail}
            {channel.isActive === false ? (
              <Badge variant="secondary">Inactive</Badge>
            ) : (
              <Badge className="bg-success/15 text-success">Active</Badge>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            SMTP {channel.smtpHost}
            {channel.smtpPort ? `:${channel.smtpPort}` : ""}
            {channel.imapHost ? ` · IMAP ${channel.imapHost}` : " · IMAP not set (no replies)"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onTest(channel.id)} loading={testing}>
          <CheckCircle2 className="h-4 w-4" /> Test SMTP
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => onDelete(channel.id)}>
          <Trash2 className="h-4 w-4" /> Remove
        </Button>
      </div>
    </div>
  );
}

export default function EmailChannelsPage() {
  const { data: channels = [], isPending, error, refetch } = useEmailChannels();
  const connect = useConnectChannel();
  const test = useTestChannel();
  const del = useDeleteChannel();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(emailChannelSchema),
    defaultValues: {
      fromName: "",
      fromEmail: "",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
      smtpSecure: false,
      imapHost: "imap.gmail.com",
      imapPort: 993,
      imapUser: "",
      imapPass: "",
    },
  });

  const onSubmit = (values) => connect.mutate(values, { onSuccess: () => reset() });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected email accounts</CardTitle>
          <CardDescription>
            Connect your company inbox to send and receive email with customers directly from the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : channels.length === 0 ? (
            <EmptyState
              icon={Plug}
              title="No email account connected"
              description="Connect one below to start emailing customers and leads."
              className="border-0"
            />
          ) : (
            <div className="space-y-3">
              {channels.map((c) => (
                <ConnectedChannel
                  key={c.id}
                  channel={c}
                  onTest={(id) => test.mutate(id)}
                  onDelete={(id) => del.mutate(id)}
                  testing={test.isPending && test.variables === c.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connect an email account</CardTitle>
          <CardDescription>
            For Gmail, enable 2FA and use an{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              App Password
            </a>{" "}
            for both SMTP and IMAP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput register={register} name="fromName" label="From name" placeholder="Acme Support" error={errors.fromName} />
              <FormInput register={register} name="fromEmail" type="email" label="From email" placeholder="support@acme.com" required error={errors.fromEmail} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Outgoing (SMTP)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput register={register} name="smtpHost" label="SMTP host" placeholder="smtp.gmail.com" required error={errors.smtpHost} />
                <FormNumber register={register} name="smtpPort" label="SMTP port" placeholder="587" error={errors.smtpPort} />
                <FormInput register={register} name="smtpUser" label="SMTP user" placeholder="support@acme.com" required error={errors.smtpUser} />
                <FormInput register={register} name="smtpPass" type="password" label="SMTP password / app password" required error={errors.smtpPass} />
                <FormSwitch control={control} name="smtpSecure" label="Use SSL (port 465)" hint="Leave off for STARTTLS on 587." />
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-sm font-medium">Incoming (IMAP) — for receiving replies</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput register={register} name="imapHost" label="IMAP host" placeholder="imap.gmail.com" error={errors.imapHost} />
                <FormNumber register={register} name="imapPort" label="IMAP port" placeholder="993" error={errors.imapPort} />
                <FormInput register={register} name="imapUser" label="IMAP user" placeholder="support@acme.com" error={errors.imapUser} />
                <FormInput register={register} name="imapPass" type="password" label="IMAP password / app password" error={errors.imapPass} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={connect.isPending}>
                <Plug className="h-4 w-4" /> Connect account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
