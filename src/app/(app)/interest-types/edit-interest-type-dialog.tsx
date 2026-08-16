"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "./actions";

export function EditInterestTypeDialog({
  action,
  currentName,
  currentGroup,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  currentName: string;
  currentGroup: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [wasPending, setWasPending] = useState(false);
  if (wasPending !== isPending) {
    if (wasPending && !isPending && !state?.error) {
      setOpen(false);
    }
    setWasPending(isPending);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="ghost" size="sm">
            Edit
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit interest</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={currentName}
              placeholder="e.g. Lute song"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="group">Group (optional)</Label>
            <Input
              id="group"
              name="group"
              defaultValue={currentGroup ?? ""}
              placeholder="e.g. Ensemble"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
