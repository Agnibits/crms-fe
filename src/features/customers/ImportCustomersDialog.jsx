"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseCsvFile } from "@/utils/export";
import { customerService } from "@/services/customer.service";
import { QUERY_KEYS } from "@/constants/app";
import { formatBytes } from "@/utils/format";

const MAX_ROWS = 100;
const ALLOWED_STATUSES = ["active", "inactive", "churned"];

/** Map a raw CSV row (case-insensitive headers) onto the customer payload. */
function toPayload(row) {
  const get = (...keys) => {
    for (const key of keys) {
      const found = Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());
      if (found && String(row[found]).trim() !== "") return String(row[found]).trim();
    }
    return "";
  };
  const status = get("status").toLowerCase();
  return {
    name: get("name", "company", "company name"),
    contactName: get("contactName", "contact", "contact name"),
    email: get("email"),
    phone: get("phone"),
    website: get("website"),
    industry: get("industry"),
    status: ALLOWED_STATUSES.includes(status) ? status : "active",
    city: get("city"),
    country: get("country"),
    address: get("address"),
  };
}

/**
 * CSV import dialog for customers.
 *   <ImportCustomersDialog open={open} onOpenChange={setOpen} />
 */
export default function ImportCustomersDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (nextOpen) => {
    if (importing) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!/\.csv$/i.test(selected.name)) {
      toast.error("Please choose a .csv file");
      e.target.value = "";
      return;
    }
    setFile(selected);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const rows = await parseCsvFile(file);
      if (!rows.length) {
        toast.error("The CSV file is empty");
        return;
      }
      const capped = rows.slice(0, MAX_ROWS);
      let created = 0;
      let skipped = rows.length - capped.length;
      let failed = 0;

      for (const row of capped) {
        const payload = toPayload(row);
        if (!payload.name || !payload.email) {
          skipped += 1;
          continue;
        }
        try {
          await customerService.create(payload);
          created += 1;
        } catch {
          failed += 1;
        }
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      if (created > 0) {
        const extras = [
          skipped > 0 ? `${skipped} skipped` : null,
          failed > 0 ? `${failed} failed` : null,
        ]
          .filter(Boolean)
          .join(", ");
        toast.success(`Imported ${created} customer(s)${extras ? ` (${extras})` : ""}`);
        reset();
        onOpenChange(false);
      } else {
        toast.error("No rows could be imported — check that name and email columns are present");
      }
    } catch {
      toast.error("Could not read the CSV file");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import customers</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns like <span className="font-medium">name, email, phone,
            industry, status, city, country</span>. Up to {MAX_ROWS} rows are imported per file.
          </DialogDescription>
        </DialogHeader>

        {file ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              disabled={importing}
              aria-label="Remove file"
            >
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center transition-colors hover:bg-muted/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </span>
            <span className="text-sm font-medium">Click to choose a CSV file</span>
            <span className="text-xs text-muted-foreground">.csv up to {MAX_ROWS} rows</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file} loading={importing}>
            <Upload /> Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
