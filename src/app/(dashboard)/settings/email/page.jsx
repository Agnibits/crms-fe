"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Plug,
  Trash2,
  CheckCircle2,
  Info,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/utils/cn";

/* Provider presets — the user picks their email provider and we fill in the
   technical SMTP/IMAP host + port so they never have to know them. */
const PROVIDERS = [
  {
    value: "gmail",
    label: "Gmail / Google Workspace",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecure: false,
    imapHost: "imap.gmail.com",
    imapPort: 993,
  },
  {
    value: "outlook",
    label: "Outlook / Microsoft 365",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    smtpSecure: false,
    imapHost: "outlook.office365.com",
    imapPort: 993,
  },
  {
    value: "yahoo",
    label: "Yahoo Mail",
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    smtpSecure: true,
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
  },
  {
    value: "zoho",
    label: "Zoho Mail",
    smtpHost: "smtp.zoho.com",
    smtpPort: 587,
    smtpSecure: false,
    imapHost: "imap.zoho.com",
    imapPort: 993,
  },
  {
    value: "other",
    label: "Other provider",
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    imapHost: "",
    imapPort: 993,
  },
];

/* Plain-language, step-by-step setup guidance per provider. */
const HELP = {
  gmail: {
    note: "Gmail won't accept your normal password here — you need a free App Password (about 2 minutes).",
    steps: [
      "In your Google Account → Security, turn on 2-Step Verification.",
      "Open the App Passwords page, type a name like “CRM”, and create it. Google shows a 16-character code.",
      "Copy that 16-character code and paste it into “Email password” below (not your normal Gmail password).",
    ],
    link: { href: "https://myaccount.google.com/apppasswords", label: "Open Gmail App Passwords" },
  },
  outlook: {
    note: "Use your Outlook/Microsoft 365 email and password. If your account has 2-Step Verification, create an App Password instead.",
    steps: [
      "Sign in at account.microsoft.com → Security.",
      "If 2-Step Verification is on, open “App passwords” and create one.",
      "Paste your password (or the app password) into “Email password” below.",
    ],
    link: { href: "https://account.microsoft.com/security", label: "Open Microsoft Security" },
  },
  yahoo: {
    note: "Yahoo requires an App Password — your normal password won't work.",
    steps: [
      "Go to Yahoo Account Security.",
      "Select “Generate app password” and create one for “Mail”.",
      "Paste the generated password into “Email password” below.",
    ],
    link: { href: "https://login.yahoo.com/account/security", label: "Open Yahoo Security" },
  },
  zoho: {
    note: "If your Zoho account has 2FA, generate an App Password; otherwise your normal password works.",
    steps: [
      "Open Zoho Account → Security → App Passwords.",
      "Generate a password named “CRM”.",
      "Paste it into “Email password” below.",
    ],
    link: { href: "https://accounts.zoho.com/home#security/app_password", label: "Open Zoho App Passwords" },
  },
  other: {
    note: "Find your provider's email settings (often under “IMAP/SMTP” or “Email setup”) and enter them in Advanced settings below.",
    steps: [
      "Get the SMTP host & port (for sending) and IMAP host & port (for receiving) from your provider.",
      "Open “Advanced settings” below and fill them in.",
      "Use your email address as the username and your email/app password as the password.",
    ],
    link: null,
  },
};

function ConnectedChannel({ channel, onTest, onDelete, testing }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
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

  const [provider, setProvider] = useState("gmail");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  const fromEmail = watch("fromEmail");
  const smtpPass = watch("smtpPass");

  // Apply the chosen provider's host/port so the user never types them.
  useEffect(() => {
    const p = PROVIDERS.find((x) => x.value === provider);
    if (!p) return;
    setValue("smtpHost", p.smtpHost);
    setValue("smtpPort", p.smtpPort);
    setValue("smtpSecure", p.smtpSecure);
    setValue("imapHost", p.imapHost);
    setValue("imapPort", p.imapPort);
    // "Other" has no preset hosts — open Advanced so the user can fill them.
    if (provider === "other") setShowAdvanced(true);
  }, [provider, setValue]);

  // The email address is the username for both SMTP and IMAP.
  useEffect(() => {
    setValue("smtpUser", fromEmail || "");
    setValue("imapUser", fromEmail || "");
  }, [fromEmail, setValue]);

  // The same password receives replies over IMAP.
  useEffect(() => {
    setValue("imapPass", smtpPass || "");
  }, [smtpPass, setValue]);

  const onSubmit = (values) =>
    connect.mutate(values, {
      onSuccess: () => {
        reset();
        setProvider("gmail");
        setShowAdvanced(false);
      },
    });

  const help = HELP[provider];

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
              description="Follow the steps below to connect one — it only takes a couple of minutes."
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
            Pick your email provider and enter your login — we handle the technical settings for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Step 1 — provider */}
            <div className="space-y-1.5">
              <Label>
                <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  1
                </span>
                Which email provider do you use?
              </Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step-by-step help for the chosen provider */}
            {help && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {help.note}
                </p>
                <ol className="mt-3 space-y-2 pl-1">
                  {help.steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/30 text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {help.link && (
                  <a
                    href={help.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {help.link.label}
                  </a>
                )}
              </div>
            )}

            {/* Step 2 — the only fields most people need */}
            <div className="space-y-3">
              <Label className="flex items-center">
                <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  2
                </span>
                Enter your email login
              </Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput register={register} name="fromName" label="Display name" placeholder="Acme Support" hint="Shown as the sender name" error={errors.fromName} />
                <FormInput register={register} name="fromEmail" type="email" label="Email address" placeholder="support@acme.com" required error={errors.fromEmail} />
                <FormInput register={register} name="smtpPass" type="password" label="Email password" placeholder="App password or account password" required error={errors.smtpPass} hint="For Gmail/Yahoo, paste the App Password from the steps above" />
              </div>
            </div>

            {/* Advanced — hidden by default; auto-open for “Other” */}
            <div className="rounded-lg border">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
              >
                <span>Advanced settings (host &amp; port)</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
              </button>
              {showAdvanced && (
                <div className="space-y-5 border-t p-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">Outgoing (SMTP) — for sending</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormInput register={register} name="smtpHost" label="SMTP host" placeholder="smtp.gmail.com" required error={errors.smtpHost} />
                      <FormNumber register={register} name="smtpPort" label="SMTP port" placeholder="587" error={errors.smtpPort} />
                      <FormSwitch control={control} name="smtpSecure" label="Use SSL (port 465)" hint="Leave off for STARTTLS on 587." />
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-2 text-sm font-medium">Incoming (IMAP) — for receiving replies</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormInput register={register} name="imapHost" label="IMAP host" placeholder="imap.gmail.com" error={errors.imapHost} />
                      <FormNumber register={register} name="imapPort" label="IMAP port" placeholder="993" error={errors.imapPort} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Username and password are taken from your email login above.
                    </p>
                  </div>
                </div>
              )}
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
