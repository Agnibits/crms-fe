"use client";

import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/services/api";

const TONES = ["Professional", "Friendly", "Persuasive", "Concise", "Warm"];
const LENGTHS = ["Short", "Medium", "Long"];

/**
 * AI email/message writer dialog.
 *   <AiEmailDialog open={open} onOpenChange={setOpen} channel="email"
 *     recipient="Acme Corp" onApply={({subject, body}) => …} />
 */
export default function AiEmailDialog({ open, onOpenChange, channel = "email", recipient = "", company = "", onApply }) {
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, tone: tone.toLowerCase(), length: length.toLowerCase(), brief, recipient, company }),
      });
      const data = await res.json();
      setResult({ subject: data.subject || "", body: data.body || "" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't generate. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    onApply?.(result);
    onOpenChange(false);
    setResult(null);
    setBrief("");
    toast.success("Draft applied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary" /> Draft with AI
          </DialogTitle>
          <DialogDescription>
            Describe what you want to say — AI will write the {channel === "sms" ? "message" : "email"} for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ai-brief">What's this about?</Label>
            <Textarea
              id="ai-brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. Follow up after the product demo, mention the 20% launch discount and ask for a call next week."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generate} loading={loading} className="w-full" variant="secondary">
            <Wand2 className="h-4 w-4" /> {result ? "Regenerate" : "Generate"}
          </Button>

          {result && (
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              {channel !== "sms" && result.subject && (
                <p className="text-sm"><span className="font-medium">Subject:</span> {result.subject}</p>
              )}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{result.body}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={apply} disabled={!result}>Use this draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
