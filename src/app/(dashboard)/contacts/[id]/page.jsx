"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import UserAvatar from "@/components/common/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { contactHooks } from "@/features/contacts/hooks";
import { formatDate } from "@/utils/format";

function DefItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm">{children ?? "—"}</dd>
    </div>
  );
}

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: contact, isPending, error, refetch } = contactHooks.useDetail(id);
  const remove = contactHooks.useRemove();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contact" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.name}
        description="Contact profile and related customer."
        actions={
          <>
            <Button variant="outline" onClick={() => router.push(`/contacts/${id}/edit`)}>
              <Pencil /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete
            </Button>
          </>
        }
      />

      {/* Profile card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <UserAvatar name={contact.name} src={contact.avatar} className="h-20 w-20 text-xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-lg font-semibold">{contact.name}</h2>
              {contact.isPrimary && (
                <Badge
                  variant="outline"
                  className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                >
                  <Star className="h-3 w-3 fill-current" /> Primary contact
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:justify-start">
              {contact.jobTitle && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> {contact.jobTitle}
                </span>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {contact.phone}
                </span>
              )}
              {contact.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {contact.city}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Contact details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <DefItem label="Full name">{contact.name}</DefItem>
              <DefItem label="Email">{contact.email || "—"}</DefItem>
              <DefItem label="Phone">{contact.phone || "—"}</DefItem>
              <DefItem label="Job title">{contact.jobTitle || "—"}</DefItem>
              <DefItem label="City">{contact.city || "—"}</DefItem>
              <DefItem label="Primary contact">{contact.isPrimary ? "Yes" : "No"}</DefItem>
              <DefItem label="Created">{formatDate(contact.createdAt)}</DefItem>
            </dl>
          </CardContent>
        </Card>

        {/* Related customer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {contact.customerId ? (
              <Link
                href={`/customers/${contact.customerId}`}
                className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-primary">
                    {contact.customerName || "View customer"}
                  </span>
                  <span className="block text-xs text-muted-foreground">Open customer record</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                This contact isn't linked to a customer yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete contact?"
        description="This will permanently remove the contact and cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(id, { onSuccess: () => router.push("/contacts") })}
      />
    </div>
  );
}
