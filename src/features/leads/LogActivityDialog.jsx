"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_TYPES } from "@/constants/options";
import { activityService } from "@/services/activity.service";
import { taskService } from "@/services/task.service";
import { toastError } from "@/services/api";
import { QUERY_KEYS } from "@/constants/app";

/** yyyy-MM-dd, `days` from today. */
function dateInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Quick "log a call / add a note" dialog for a record's timeline.
 * Works for any entity with a timeline — leads and deals today.
 *   <LogActivityDialog entity={lead} relatedType="LEAD" queryKey={QUERY_KEYS.leads} … />
 */
export default function LogActivityDialog({
  entity,
  relatedType = "LEAD",
  queryKey = QUERY_KEYS.leads,
  open,
  onOpenChange,
  defaultType = "call",
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  // Follow-up: on by default so scheduling the next step becomes a habit.
  const [createFollowUp, setCreateFollowUp] = useState(true);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDue, setFollowUpDue] = useState(() => dateInDays(2));

  // Fresh form each time the dialog opens (respecting the requested type).
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setSubject("");
      setDescription("");
      setCreateFollowUp(true);
      setFollowUpTitle("");
      setFollowUpDue(dateInDays(2));
    }
  }, [open, defaultType]);

  const create = useMutation({
    mutationFn: async () => {
      await activityService.create({
        type,
        subject: subject.trim(),
        description: description.trim() || undefined,
        relatedType,
        relatedId: entity.id,
        // Stamp the customer FK too so the account's activity views find it.
        ...(relatedType === "CUSTOMER" ? { customerId: entity.id } : {}),
        completedAt: new Date().toISOString(),
      });
      // Schedule the next step, linked to the same lead/deal.
      if (createFollowUp) {
        await taskService.create({
          title: followUpTitle.trim() || `Follow up: ${subject.trim()}`,
          dueDate: followUpDue ? new Date(followUpDue).toISOString() : undefined,
          relatedType,
          relatedId: entity.id,
        });
      }
    },
    onSuccess: () => {
      toast.success(createFollowUp ? "Activity logged · follow-up scheduled" : "Activity logged");
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", entity.id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      onOpenChange(false);
    },
    onError: (error) => toastError(error, "Failed to log activity"),
  });

  if (!entity) return null;
  const canSave = subject.trim().length > 0 && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Log Activity
          </DialogTitle>
          <DialogDescription>
            Record a touchpoint with {entity.name} — it shows up on the timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger aria-label="Activity type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="activity-subject">Subject</Label>
              <Input
                id="activity-subject"
                placeholder="e.g. Intro call"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activity-description">Details</Label>
            <Textarea
              id="activity-description"
              rows={4}
              placeholder="What was discussed? Next step?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Follow-up task — the next touchpoint, so nothing slips */}
          <div className="rounded-lg border p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={createFollowUp}
                onCheckedChange={(v) => setCreateFollowUp(Boolean(v))}
              />
              Schedule a follow-up task
            </label>
            {createFollowUp && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="followup-title" className="text-xs text-muted-foreground">
                    Task
                  </Label>
                  <Input
                    id="followup-title"
                    placeholder={subject.trim() ? `Follow up: ${subject.trim()}` : "e.g. Call back"}
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="followup-due" className="text-xs text-muted-foreground">
                    Due date
                  </Label>
                  <Input
                    id="followup-due"
                    type="date"
                    value={followUpDue}
                    onChange={(e) => setFollowUpDue(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} disabled={!canSave}>
            {create.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
