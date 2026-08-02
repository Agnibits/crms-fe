"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useSetUserPassword } from "@/features/users/hooks";

/**
 * Admin-set a member's password. For people who can't use the emailed reset
 * link (new hires, accounts on a mailbox nobody reads). Signs them out
 * everywhere, so they must sign in again with the new password.
 */
export default function SetPasswordDialog({ open, onOpenChange, user }) {
  const setPassword = useSetUserPassword();
  const [password, setPassword_] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword_("");
      setTouched(false);
    }
  }, [open]);

  const tooShort = password.length > 0 && password.length < 8;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (password.length < 8) return;
    setPassword.mutate(
      { id: user.id, password },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set password</DialogTitle>
          <DialogDescription>
            Set a new password for <span className="font-medium">{user?.name}</span>. They&apos;ll
            be signed out everywhere and must use this password to sign in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="text"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword_(e.target.value)}
              placeholder="At least 8 characters"
              aria-invalid={touched && password.length < 8}
            />
            {(tooShort || (touched && !password)) && (
              <p className="text-xs font-medium text-destructive">
                Password must be at least 8 characters
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Shown in plain text so you can copy it and share it with them.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={setPassword.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={setPassword.isPending}>
              <KeyRound className="h-4 w-4" /> Set password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
