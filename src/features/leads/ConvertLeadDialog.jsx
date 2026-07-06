"use client";

import { useRouter } from "next/navigation";
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
import { formatCurrency } from "@/utils/format";
import { leadHooks } from "./hooks";

/**
 * Confirms converting a lead into a customer.
 *   <ConvertLeadDialog lead={lead} open={open} onOpenChange={setOpen} />
 */
export default function ConvertLeadDialog({ lead, open, onOpenChange }) {
  const router = useRouter();
  const convert = leadHooks.useAction({
    successMessage: "Lead converted to customer",
    onSuccess: () => {
      onOpenChange(false);
      router.push("/customers");
    },
  });

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" /> Convert Lead to Customer
          </DialogTitle>
          <DialogDescription>
            This marks the lead as won and creates a new customer record from its details.
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={convert.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => convert.mutate({ id: lead.id, action: "convert" })}
            disabled={convert.isPending}
          >
            {convert.isPending ? "Converting…" : "Convert to Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
