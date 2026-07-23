"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  Download,
  ExternalLink,
  Globe,
  Handshake,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Star,
  StickyNote,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import StatCard from "@/components/common/StatCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import UserAvatar from "@/components/common/UserAvatar";
import ActivityTimeline from "@/components/common/ActivityTimeline";
import TagEditor from "@/components/common/TagEditor";
import LogActivityDialog from "@/features/leads/LogActivityDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerHooks, useOwners } from "@/features/customers/hooks";
import { customerService } from "@/services/customer.service";
import { opportunityService } from "@/services/opportunity.service";
import { useStageOptions } from "@/features/opportunities/useStageOptions";
import { CUSTOMER_STATUSES, INVOICE_STATUSES } from "@/constants/options";
import { QUERY_KEYS } from "@/constants/app";
import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelative,
} from "@/utils/format";

/** Shared loading/error/empty wrapper for tab content. */
function TabSection({ query, emptyTitle, emptyDescription, children }) {
  if (query.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (query.error) return <ErrorState error={query.error} onRetry={query.refetch} />;
  const items = query.data ?? [];
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return children(items);
}

function DefItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm">{children ?? "—"}</dd>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Which tab is open — pure display tabs load their data only when visited.
  const [tab, setTab] = useState("overview");

  const { data: customer, isPending, error, refetch } = customerHooks.useDetail(id);
  const timeline = customerHooks.useSub(id, "timeline", { enabled: !!id && tab === "timeline" });
  const contacts = customerHooks.useSub(id, "contacts", { enabled: !!id && tab === "contacts" });
  // Real deals live on the Opportunity model — the legacy /:id/deals is empty.
  // Kept eager: the Open Deals KPI needs it.
  const deals = useQuery({
    queryKey: [...QUERY_KEYS.customers, "detail", id, "opportunities"],
    queryFn: ({ signal }) => opportunityService.list({ customerId: id, limit: 100 }, { signal }),
    enabled: !!id,
  });
  // Kept eager: the Total Billed / Collected / Outstanding KPIs need it.
  const invoices = customerHooks.useSub(id, "invoices");
  const files = customerHooks.useSub(id, "files", { enabled: !!id && tab === "files" });
  const notes = customerHooks.useSub(id, "notes", { enabled: !!id && tab === "notes" });
  const { ownersById } = useOwners();
  const { stageOptions } = useStageOptions();

  const remove = customerHooks.useRemove();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const dealItems = deals.data?.items ?? [];
  // The /customers/:id/invoices rows are raw — balance (total − amountPaid) is derived here.
  const invoiceItems = (invoices.data ?? []).map((i) => {
    const total = Number(i.total) || 0;
    const amountPaid = Number(i.amountPaid) || 0;
    return {
      ...i,
      number: i.invoiceNumber ?? i.number,
      status: String(i.status ?? "").toLowerCase(),
      total,
      amountPaid,
      balance: total - amountPaid,
    };
  });
  // Account KPIs from the customer's real deals + invoices.
  const openDeals = dealItems.filter((d) => d.status === "OPEN" || d.status === "open");
  const openDealsValue = openDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalBilled = invoiceItems.reduce((sum, i) => sum + i.total, 0);
  const outstanding = invoiceItems.reduce((sum, i) => sum + i.balance, 0);

  // "Add note" — POST /customers/:id/notes, optimistic local echo + toast.
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [localNotes, setLocalNotes] = useState([]);

  const handleAddNote = async () => {
    const body = noteBody.trim();
    if (!body) return;
    setAddingNote(true);
    try {
      await customerService.addNote(id, body);
      setLocalNotes((prev) => [
        { id: `local-${Date.now()}`, content: body, userName: "You", createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setNoteBody("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Customer" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // getById returns a resolved `owner` object; fall back to the users lookup.
  const owner = customer.owner
    ? { ...customer.owner, name: [customer.owner.firstName, customer.owner.lastName].filter(Boolean).join(" ") }
    : ownersById[customer.ownerId];
  const allNotes = [...localNotes, ...(notes.data ?? [])];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description="Customer account overview and related records."
        actions={
          <>
            <Button variant="outline" onClick={() => setLogOpen(true)}>
              <ClipboardList /> Log Activity
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/deals/new?customerId=${id}`)}
            >
              <Handshake /> New Deal
            </Button>
            <Button onClick={() => router.push(`/invoices/new?customerId=${id}`)}>
              <Receipt /> New Invoice
            </Button>
            <Button variant="outline" onClick={() => router.push(`/customers/${id}/edit`)}>
              <Pencil /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete
            </Button>
          </>
        }
      />

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{customer.name}</h2>
                <StatusBadge value={customer.status} options={CUSTOMER_STATUSES} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {customer.industry && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> {customer.industry}
                  </span>
                )}
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" /> {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {customer.phone}
                  </span>
                )}
                {(customer.city || customer.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[customer.city, customer.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {customer.website && (
                  <a
                    href={customer.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Globe className="h-3.5 w-3.5" /> Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {/* Tags — segment this account (VIP, reseller, region…) */}
              <TagEditor entityType="CUSTOMER" entityId={id} className="mt-3" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-lg border p-3">
            <UserAvatar name={owner?.name} src={owner?.avatar} className="h-9 w-9" />
            <div>
              <p className="text-xs text-muted-foreground">Account owner</p>
              <p className="text-sm font-medium">{owner?.name ?? "Unassigned"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title="Total Billed"
          value={formatCurrency(totalBilled)}
          icon={Receipt}
          hint="across all invoices"
          loading={invoices.isPending}
          index={0}
        />
        <StatCard
          title="Collected"
          value={formatCurrency(customer.revenue || 0)}
          icon={Building2}
          hint="payments received"
          loading={isPending}
          index={1}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(outstanding)}
          icon={Receipt}
          hint="balance to collect"
          loading={invoices.isPending}
          index={2}
        />
        <StatCard
          title="Open Deals"
          value={formatCurrency(openDealsValue)}
          icon={Handshake}
          hint={`${openDeals.length} in pipeline`}
          loading={deals.isPending}
          index={3}
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <DefItem label="Company name">{customer.name}</DefItem>
                <DefItem label="Primary contact">{customer.contactName || "—"}</DefItem>
                <DefItem label="Email">{customer.email || "—"}</DefItem>
                <DefItem label="Phone">{customer.phone || "—"}</DefItem>
                <DefItem label="Website">
                  {customer.website ? (
                    <a
                      href={customer.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {customer.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </DefItem>
                <DefItem label="Industry">{customer.industry || "—"}</DefItem>
                <DefItem label="Status">
                  <StatusBadge value={customer.status} options={CUSTOMER_STATUSES} />
                </DefItem>
                <DefItem label="Owner">{owner?.name ?? "Unassigned"}</DefItem>
                <DefItem label="City">{customer.city || "—"}</DefItem>
                <DefItem label="Country">{customer.country || "—"}</DefItem>
                <DefItem label="Address">{customer.address || "—"}</DefItem>
                <DefItem label="Revenue">
                  {customer.revenue > 0 ? formatCurrency(customer.revenue) : "—"}
                </DefItem>
                <DefItem label="Employees">
                  {customer.employees > 0 ? formatNumber(customer.employees) : "—"}
                </DefItem>
                <DefItem label="Created">{formatDate(customer.createdAt)}</DefItem>
                <DefItem label="Last updated">{formatDate(customer.updatedAt)}</DefItem>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline
                query={timeline}
                emptyDescription="Calls, meetings, emails and notes with this customer will show up here."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              <TabSection
                query={contacts}
                emptyTitle="No contacts"
                emptyDescription="People at this company will appear here."
              >
                {(items) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Job title</TableHead>
                        <TableHead className="w-16">Primary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((contact) => (
                        <TableRow
                          key={contact.id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                        >
                          <TableCell className="font-medium">
                            {`${contact.firstName} ${contact.lastName || ""}`.trim()}
                          </TableCell>
                          <TableCell>{contact.email || "—"}</TableCell>
                          <TableCell>{contact.phone || "—"}</TableCell>
                          <TableCell>{contact.designation || "—"}</TableCell>
                          <TableCell>
                            {contact.isPrimary ? (
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals */}
        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deals</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {deals.isPending ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : deals.error ? (
                <ErrorState error={deals.error} onRetry={deals.refetch} />
              ) : dealItems.length === 0 ? (
                <EmptyState
                  title="No deals"
                  description="Deals with this customer will appear here."
                  actionLabel="New Deal"
                  onAction={() => router.push(`/deals/new?customerId=${id}`)}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Expected close</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealItems.map((deal) => (
                      <TableRow
                        key={deal.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/deals/${deal.id}`)}
                      >
                        <TableCell className="font-medium">{deal.name}</TableCell>
                        <TableCell>
                          {deal.status === "WON" || deal.status === "LOST" ? (
                            <StatusBadge
                              value={deal.status}
                              options={[
                                { value: "WON", label: "Won", color: "green" },
                                { value: "LOST", label: "Lost", color: "red" },
                              ]}
                            />
                          ) : (
                            <StatusBadge value={deal.stage} options={stageOptions} />
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(deal.amount)}
                        </TableCell>
                        <TableCell>{formatDate(deal.expectedCloseDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {invoices.isPending ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : invoices.error ? (
                <ErrorState error={invoices.error} onRetry={invoices.refetch} />
              ) : invoiceItems.length === 0 ? (
                <EmptyState
                  title="No invoices"
                  description="Invoices billed to this customer will appear here."
                  actionLabel="New Invoice"
                  onAction={() => router.push(`/invoices/new?customerId=${id}`)}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Due date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                      >
                        <TableCell className="font-medium">{invoice.number}</TableCell>
                        <TableCell>
                          <StatusBadge value={invoice.status} options={INVOICE_STATUSES} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(invoice.balance)}
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Files</CardTitle>
            </CardHeader>
            <CardContent>
              <TabSection
                query={files}
                emptyTitle="No files"
                emptyDescription="Documents attached to this customer will appear here."
              >
                {(items) => (
                  <ul className="divide-y">
                    {items.map((file) => (
                      <li key={file.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)} · {file.uploadedBy} ·{" "}
                            {formatDate(file.createdAt)}
                          </p>
                        </div>
                        <Button asChild variant="ghost" size="icon-sm" aria-label={`Download ${file.name}`}>
                          <a href={file.url || "#"} download>
                            <Download />
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </TabSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={3}
                  placeholder="Write a note about this customer…"
                  aria-label="New note"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    loading={addingNote}
                    disabled={!noteBody.trim()}
                  >
                    <StickyNote /> Add note
                  </Button>
                </div>
              </div>

              {notes.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : notes.error ? (
                <ErrorState error={notes.error} onRetry={notes.refetch} />
              ) : allNotes.length === 0 ? (
                <EmptyState
                  icon={StickyNote}
                  title="No notes yet"
                  description="Use the box above to add the first note."
                />
              ) : (
                <ul className="space-y-3">
                  {allNotes.map((note) => (
                    <li key={note.id} className="rounded-lg border p-3">
                      <p className="whitespace-pre-wrap text-sm">
                        {note.content || note.description || note.subject}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {(note.userName ||
                          [note.user?.firstName, note.user?.lastName].filter(Boolean).join(" ") ||
                          "—") + " · "}
                        {formatRelative(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LogActivityDialog
        entity={customer}
        relatedType="CUSTOMER"
        queryKey={QUERY_KEYS.customers}
        open={logOpen}
        onOpenChange={setLogOpen}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete customer?"
        description="This will permanently remove the customer and cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(id, { onSuccess: () => router.push("/customers") })
        }
      />
    </div>
  );
}
