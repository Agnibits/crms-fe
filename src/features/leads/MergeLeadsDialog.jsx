"use client";

import { useState } from "react";
import { Merge } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { leadHooks } from "./hooks";

/**
 * Merge a duplicate lead into the primary one.
 *   <MergeLeadsDialog lead={primaryLead} open={open} onOpenChange={setOpen} />
 */
export default function MergeLeadsDialog({ lead, open, onOpenChange }) {
  const [mergeId, setMergeId] = useState("");

  const { data, isPending } = leadHooks.useList({ limit: 100 }, { enabled: open });
  const candidates = (data?.items ?? []).filter((l) => l.id !== lead?.id);

  const merge = leadHooks.useAction({
    successMessage: "Leads merged successfully",
    onSuccess: () => {
      setMergeId("");
      onOpenChange(false);
    },
  });

  if (!lead) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setMergeId("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" /> Merge Duplicate Lead
          </DialogTitle>
          <DialogDescription>
            Pick the duplicate lead to merge into{" "}
            <span className="font-medium text-foreground">{lead.name}</span>. The duplicate's
            details will be combined into this record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="merge-lead">Duplicate lead</Label>
          <Select value={mergeId || undefined} onValueChange={setMergeId}>
            <SelectTrigger id="merge-lead">
              <SelectValue placeholder={isPending ? "Loading leads…" : "Select a lead to merge…"} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} · {l.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merge.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => merge.mutate({ id: lead.id, action: "merge", payload: { mergeId } })}
            disabled={!mergeId || merge.isPending}
          >
            {merge.isPending ? "Merging…" : "Merge Leads"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
