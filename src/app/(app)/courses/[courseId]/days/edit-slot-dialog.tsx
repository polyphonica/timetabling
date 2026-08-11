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

export function EditSlotDialog({
  action,
  initial,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initial: {
    startTime: string;
    endTime: string;
    kind: "session" | "break";
    label: string | null;
  };
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
          <DialogTitle>Edit time slot</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={initial.startTime.slice(0, 5)}
                required
                className="w-32"
              />
            </div>
            <span className="mt-6 text-sm text-muted-foreground">to</span>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={initial.endTime.slice(0, 5)}
                required
                className="w-32"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="kind">Type</Label>
            <select
              id="kind"
              name="kind"
              defaultValue={initial.kind}
              className="h-9 rounded-md border bg-transparent px-2 text-sm"
            >
              <option value="session">Session</option>
              <option value="break">Break</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              name="label"
              defaultValue={initial.label ?? ""}
              placeholder="e.g. Lunch"
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
