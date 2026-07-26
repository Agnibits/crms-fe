"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, User, UserCheck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { getDefaultPipeline } from "@/services/opportunity.service";
import { leadHooks } from "./hooks";

/** yyyy-MM-dd, `days` from today — sensible default for expected close. */
function dateInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Confirms converting a lead into a customer, optionally creating a deal in
 * the default pipeline (value/probability carried over from the lead).
 *   <ConvertLeadDialog lead={lead} open={open} onOpenChange={setOpen} />
 */
export default function ConvertLeadDialog({ lead, open, onOpenChange }) {
  const router = useRouter();
  const [withDeal, setWithDeal] = useState(true);
  const [closeDate, setCloseDate] = useState(() => dateInDays(30));
  // Business (company + contact) vs individual (person only). Default inferred
  // from whether the lead has a company; the user confirms/overrides here.
  const [isBusiness, setIsBusiness] = useState(true);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (open) {
      setIsBusiness(Boolean(lead?.company));
      setCompanyName(lead?.company || "");
    }
  }, [open, lead?.id, lead?.company]);

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
    const dealPart =
      withDeal && canCreateDeal
        ? {
            createOpportunity: true,
            pipelineId: pipeline.id,
            stageId: firstStage.id,
            closeDate: closeDate || undefined,
          }
        : {};
    const payload = {
      accountType: isBusiness ? "business" : "individual",
      companyName: isBusiness ? companyName || undefined : undefined,
      ...dealPart,
    };
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

        {/* Account type — confirm/override, then preview what gets created */}
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Account type</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: true, icon: Building2, title: "Business", sub: "A company with contacts" },
              { key: false, icon: User, title: "Individual", sub: "A single person" },
            ].map(({ key, icon: Icon, title, sub }) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => setIsBusiness(key)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                  isBusiness === key
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="h-4 w-4" /> {title}
                </span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </button>
            ))}
          </div>

          {isBusiness && (
            <div className="space-y-1">
              <Label htmlFor="convert-company" className="text-xs text-muted-foreground">
                Company name
              </Label>
              <Input
                id="convert-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TechNova Solutions Pvt. Ltd."
              />
            </div>
          )}

          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {isBusiness ? (
              <>
                Creates customer{" "}
                <span className="font-medium text-foreground">{companyName || lead.name}</span> and
                primary contact{" "}
                <span className="font-medium text-foreground">{lead.name}</span>.
              </>
            ) : (
              <>
                Creates individual customer{" "}
                <span className="font-medium text-foreground">{lead.name}</span>.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-lg border p-4">
          <Checkbox
            id="convert-with-deal"
            checked={withDeal && canCreateDeal}
            disabled={!canCreateDeal}
            onCheckedChange={(v) => setWithDeal(Boolean(v))}
          />
          <div className="flex-1 space-y-2">
            <Label htmlFor="convert-with-deal" className="cursor-pointer">
              Create a deal in the pipeline
            </Label>
            <p className="text-xs text-muted-foreground">
              {canCreateDeal
                ? `Starts in "${firstStage.name}" (${pipeline.name}) with ${formatCurrency(lead.value)} — track it on the Deals board.`
                : "No default pipeline found — the lead will convert to a customer only."}
            </p>
            {withDeal && canCreateDeal && (
              <div className="space-y-1 pt-1">
                <Label htmlFor="convert-close-date" className="text-xs text-muted-foreground">
                  Expected close date
                </Label>
                <Input
                  id="convert-close-date"
                  type="date"
                  className="w-44"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                />
              </div>
            )}
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
