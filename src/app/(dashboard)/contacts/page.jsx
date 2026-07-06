"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/tables/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import UserAvatar from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableState } from "@/hooks/useTableState";
import { contactHooks } from "@/features/contacts/hooks";
import { exportToCsv } from "@/utils/export";
import { formatDate } from "@/utils/format";

const EXPORT_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "jobTitle", label: "Job Title" },
  { key: "customerName", label: "Customer" },
  { key: "city", label: "City" },
  { key: "isPrimary", label: "Primary" },
  { key: "createdAt", label: "Created At" },
];

export default function ContactsPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = contactHooks.useList(t.queryParams);
  const remove = contactHooks.useRemove();
  const [deleteId, setDeleteId] = useState(null);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <UserAvatar
              name={row.original.name}
              src={row.original.avatar}
              className="h-8 w-8 shrink-0"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium">
                {row.original.name}
                {row.original.isPrimary && (
                  <Star
                    className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                    aria-label="Primary contact"
                  />
                )}
              </p>
              {row.original.jobTitle && (
                <p className="truncate text-xs text-muted-foreground">{row.original.jobTitle}</p>
              )}
            </div>
          </div>
        ),
      },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) =>
          row.original.customerId ? (
            <Link
              href={`/customers/${row.original.customerId}`}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.customerName}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      { accessorKey: "city", header: "City" },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 48,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Row actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/contacts/${row.original.id}`)}>
                <Eye className="h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/contacts/${row.original.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People you work with across your customer accounts."
        actions={
          <Button onClick={() => router.push("/contacts/new")}>
            <Plus /> Add Contact
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isPending}
        error={error}
        onRetry={refetch}
        pageCount={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        {...t.tableProps}
        onRowClick={(row) => router.push(`/contacts/${row.id}`)}
        searchPlaceholder="Search contacts…"
        emptyTitle="No contacts found"
        emptyDescription="Try adjusting your search, or add your first contact."
        actions={
          <Button
            variant="outline"
            onClick={() => exportToCsv(data?.items ?? [], "contacts.csv", EXPORT_COLUMNS)}
            disabled={!data?.items?.length}
          >
            <Download /> Export
          </Button>
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete contact?"
        description="This will permanently remove the contact and cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
