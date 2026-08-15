"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  acceptRegistration,
  rejectRegistration,
  resetRegistrationToPending,
} from "./actions";

type Status = "pending" | "accepted" | "rejected";

const REASON_OPTIONS = [
  { value: "course_full", label: "Course full" },
  { value: "inexperienced", label: "Inexperienced" },
  { value: "other", label: "Other" },
] as const;

export function RegistrationStatusBadge({ status }: { status: Status }) {
  if (status === "accepted") return <Badge>Accepted</Badge>;
  if (status === "rejected")
    return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export function RegistrationActions({
  courseId,
  registrationId,
  status,
  rejectionReason,
  rejectionNotes,
}: {
  courseId: string;
  registrationId: string;
  status: Status;
  rejectionReason: (typeof REASON_OPTIONS)[number]["value"] | null;
  rejectionNotes: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(rejectionReason ?? "course_full");
  const [state, formAction, isRejecting] = useActionState(
    rejectRegistration.bind(null, courseId, registrationId),
    undefined,
  );

  const [wasRejecting, setWasRejecting] = useState(false);
  if (wasRejecting !== isRejecting) {
    if (wasRejecting && !isRejecting && !state?.error) {
      setOpen(false);
    }
    setWasRejecting(isRejecting);
  }

  return (
    <div className="flex items-center gap-1.5">
      {status !== "accepted" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(() => acceptRegistration(courseId, registrationId))
          }
        >
          Accept
        </Button>
      )}
      {status !== "rejected" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button type="button" size="sm" variant="outline">
                Reject
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject registration</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Reason</Label>
                {REASON_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={opt.value}
                      checked={reason === opt.value}
                      onChange={() => setReason(opt.value)}
                      className="size-4 accent-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {reason === "other" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={rejectionNotes ?? ""}
                    placeholder="Explain the reason for rejection"
                  />
                </div>
              )}
              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <Button
                type="submit"
                variant="destructive"
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting…" : "Confirm rejection"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {status !== "pending" && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              resetRegistrationToPending(courseId, registrationId),
            )
          }
        >
          Reset
        </Button>
      )}
    </div>
  );
}
