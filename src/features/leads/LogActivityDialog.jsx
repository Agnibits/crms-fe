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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_TYPES } from "@/constants/options";
import { activityService } from "@/services/activity.service";
import { toastError } from "@/services/api";
import { QUERY_KEYS } from "@/constants/app";

/**
 * Quick "log a call / add a note" dialog for a lead's timeline.
 *   <LogActivityDialog lead={lead} open={open} onOpenChange={setOpen} defaultType="call" />
 */
export default function LogActivityDialog({ lead, open, onOpenChange, defaultType = "call" }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Fresh form each time the dialog opens (respecting the requested type).
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setSubject("");
      setDescription("");
    }
  }, [open, defaultType]);

  const create = useMutation({
    mutationFn: () =>
      activityService.create({
        type,
        subject: subject.trim(),
        description: description.trim() || undefined,
        relatedType: "LEAD",
        relatedId: lead.id,
        completedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Activity logged");
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.leads, "detail", lead.id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities });
      onOpenChange(false);
    },
    onError: (error) => toastError(error, "Failed to log activity"),
  });

  if (!lead) return null;
  const canSave = subject.trim().length > 0 && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Log Activity
          </DialogTitle>
          <DialogDescription>
            Record a touchpoint with {lead.name} — it shows up on the timeline.
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
