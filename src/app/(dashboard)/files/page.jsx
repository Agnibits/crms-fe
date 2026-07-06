"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  ImageIcon,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createCrudHooks } from "@/hooks/useCrud";
import { fileService } from "@/services/file.service";
import { QUERY_KEYS } from "@/constants/app";
import { formatBytes, formatRelative } from "@/utils/format";
import { cn } from "@/utils/cn";

const fileHooks = createCrudHooks({
  key: QUERY_KEYS.files,
  service: fileService,
  label: "File",
});

const FILE_TYPE_META = {
  pdf: { icon: FileText, className: "text-red-500", bg: "bg-red-500/10" },
  xlsx: { icon: FileSpreadsheet, className: "text-emerald-500", bg: "bg-emerald-500/10" },
  png: { icon: ImageIcon, className: "text-violet-500", bg: "bg-violet-500/10" },
  docx: { icon: FileText, className: "text-blue-500", bg: "bg-blue-500/10" },
};

function typeMeta(type) {
  return FILE_TYPE_META[type] || { icon: FileIcon, className: "text-muted-foreground", bg: "bg-muted" };
}

function FileActions({ file, onPreview, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${file.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onPreview(file)}>
          <Eye /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success("Download started")}>
          <Download /> Download
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(file.id)}
        >
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function FilesPage() {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isPending, error, refetch } = fileHooks.useList({ limit: 200 });
  const create = fileHooks.useCreate();
  const remove = fileHooks.useRemove();

  const files = useMemo(() => {
    const items = data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.type?.toLowerCase().includes(q) ||
        f.uploadedBy?.toLowerCase().includes(q)
    );
  }, [data, query]);

  const onUpload = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const ext = selected.name.includes(".")
      ? selected.name.split(".").pop().toLowerCase()
      : "file";
    create.mutate({
      name: selected.name,
      type: ext,
      size: selected.size,
      url: "#",
      uploadedBy: "You",
    });
    e.target.value = "";
  };

  const previewMeta = previewFile ? typeMeta(previewFile.type) : null;
  const PreviewIcon = previewMeta?.icon ?? FileIcon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="File Manager"
        description="All documents, sheets and images shared across your CRM."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={onUpload}
              aria-hidden
              tabIndex={-1}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={create.isPending}>
              <Upload /> {create.isPending ? "Uploading…" : "Upload"}
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="pl-8"
            aria-label="Search files"
          />
        </div>
        <div className="flex items-center gap-1 self-end rounded-lg border p-0.5">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <LayoutGrid />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
          >
            <List />
          </Button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          title={query ? "No files match your search" : "No files yet"}
          description={
            query
              ? "Try a different name, type or uploader."
              : "Upload your first document to get started."
          }
          actionLabel={query ? undefined : "Upload a file"}
          onAction={query ? undefined : () => inputRef.current?.click()}
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const meta = typeMeta(file.type);
            const Icon = meta.icon;
            return (
              <Card key={file.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        meta.bg
                      )}
                    >
                      <Icon className={cn("h-6 w-6", meta.className)} />
                    </span>
                    <FileActions file={file} onPreview={setPreviewFile} onDelete={setDeleteId} />
                  </div>
                  <p className="mt-3 truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs uppercase text-muted-foreground">
                    {file.type} · {formatBytes(file.size)}
                  </p>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    {file.uploadedBy} · {formatRelative(file.createdAt)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const meta = typeMeta(file.type);
                const Icon = meta.icon;
                return (
                  <TableRow key={file.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4 shrink-0", meta.className)} />
                        <span className="max-w-[280px] truncate font-medium">{file.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="uppercase text-muted-foreground">{file.type}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBytes(file.size)}
                    </TableCell>
                    <TableCell>{file.uploadedBy}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelative(file.createdAt)}
                    </TableCell>
                    <TableCell>
                      <FileActions file={file} onPreview={setPreviewFile} onDelete={setDeleteId} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{previewFile?.name}</DialogTitle>
            <DialogDescription>
              {previewFile
                ? `${String(previewFile.type).toUpperCase()} · ${formatBytes(previewFile.size)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {previewFile.type === "png" ? (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-muted/40">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-10 w-10 text-violet-500" />
                    <p className="mt-2 text-xs text-muted-foreground">Image preview placeholder</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed bg-muted/40">
                  <PreviewIcon className={cn("h-12 w-12", previewMeta?.className)} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded by</p>
                  <p className="font-medium">{previewFile.uploadedBy || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p className="font-medium">{formatRelative(previewFile.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium uppercase">{previewFile.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="font-medium">{formatBytes(previewFile.size)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast.success("Download started")}
              >
                <Download /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete file?"
        description="The file record will be permanently removed."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
