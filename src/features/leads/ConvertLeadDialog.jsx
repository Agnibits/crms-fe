"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/format";
import { getDefaultPipeline } from "@/services/opportunity.service";
import { leadHooks } from "./hooks";

/**
 * Confirms converting a lead into a customer, optionally creating a deal in
 * the default pipeline (value/probability carried over from the lead).
 *   <ConvertLeadDialog lead={lead} open={open} onOpenChange={setOpen} />
 */
export default function ConvertLeadDialog({ lead, open, onOpenChange }) {
  const router = useRouter();
  const [withDeal, setWithDeal] = useState(true);

  const { data: pipeline } = useQuery({
    queryKey: ["pipelines", "default"],
    queryFn: getDefaultPipeline,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  // Stages come ordered from the backend; the deal starts at the first one.
  const firstStage = pipeline?.stages?.[0];
  const canCreateDeal = Boolean(pipeline?.id && firstStage?.id);

  const convert = leadHooks.useAction({
    successMessage: "Lead converted",
    onSuccess: (result) => {
      onOpenChange(false);
      router.push(result?.opportunity ? "/deals" : "/customers");
    },
  });

  if (!lead) return null;

  const handleConvert = () => {
    const payload =
      withDeal && canCreateDeal
        ? { createOpportunity: true, pipelineId: pipeline.id, stageId: firstStage.id }
        : {};
    convert.mutate({ id: lead.id, action: "convert", payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" /> Convert Lead to Customer
          </DialogTitle>
          <DialogDescription>
            This creates a customer record from the lead&apos;s details.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{lead.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="font-medium">{lead.company || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate font-medium">{lead.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimated Value</p>
              <p className="font-medium tabular-nums">{formatCurrency(lead.value)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border p-4">
          <Checkbox
            id="convert-with-deal"
            checked={withDeal && canCreateDeal}
            disabled={!canCreateDeal}
            onCheckedChange={(v) => setWithDeal(Boolean(v))}
          />
          <div className="space-y-1">
            <Label htmlFor="convert-with-deal" className="cursor-pointer">
              Create a deal in the pipeline
            </Label>
            <p className="text-xs text-muted-foreground">
              {canCreateDeal
                ? `Starts in "${firstStage.name}" (${pipeline.name}) with ${formatCurrency(lead.value)} — track it on the Deals board.`
                : "No default pipeline found — the lead will convert to a customer only."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={convert.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={convert.isPending}>
            {convert.isPending ? "Converting…" : "Convert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
