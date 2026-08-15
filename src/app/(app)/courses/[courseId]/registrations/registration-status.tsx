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
  restoreRegistration,
  withdrawRegistration,
} from "./actions";

type Status = "pending" | "accepted" | "rejected" | "withdrawn";

const REASON_OPTIONS = [
  { value: "course_full", label: "Course full" },
  { value: "inexperienced", label: "Inexperienced" },
  { value: "other", label: "Other" },
] as const;

export function RegistrationStatusBadge({ status }: { status: Status }) {
  if (status === "accepted") return <Badge>Accepted</Badge>;
  if (status === "rejected")
    return <Badge variant="destructive">Rejected</Badge>;
  if (status === "withdrawn")
    return <Badge variant="secondary">Withdrawn</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export function RegistrationActions({
  courseId,
  registrationId,
  status,
  rejectionReason,
  rejectionNotes,
  withdrawalNotes,
  sessionCount,
}: {
  courseId: string;
  registrationId: string;
  status: Status;
  rejectionReason: (typeof REASON_OPTIONS)[number]["value"] | null;
  rejectionNotes: string | null;
  withdrawalNotes: string | null;
  sessionCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [reason, setReason] = useState(rejectionReason ?? "course_full");

  const [rejectState, rejectAction, isRejecting] = useActionState(
    rejectRegistration.bind(null, courseId, registrationId),
    undefined,
  );
  const [withdrawState, withdrawAction, isWithdrawing] = useActionState(
    withdrawRegistration.bind(null, courseId, registrationId),
    undefined,
  );

  const [wasRejecting, setWasRejecting] = useState(false);
  if (wasRejecting !== isRejecting) {
    if (wasRejecting && !isRejecting && !rejectState?.error) {
      setRejectOpen(false);
    }
    setWasRejecting(isRejecting);
  }

  const [wasWithdrawing, setWasWithdrawing] = useState(false);
  if (wasWithdrawing !== isWithdrawing) {
    if (wasWithdrawing && !isWithdrawing && !withdrawState?.error) {
      setWithdrawOpen(false);
    }
    setWasWithdrawing(isWithdrawing);
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-1.5">
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
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
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
            <form action={rejectAction} className="flex flex-col gap-4">
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
              {rejectState?.error && (
                <p className="text-sm text-destructive">
                  {rejectState.error}
                </p>
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
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogTrigger
          render={
            <Button type="button" size="sm" variant="outline">
              Withdraw
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw student</DialogTitle>
          </DialogHeader>
          <form action={withdrawAction} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {sessionCount > 0
                ? `This will remove them from ${sessionCount} session${sessionCount === 1 ? "" : "s"} on the timetable.`
                : "They aren't currently assigned to any sessions."}
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={withdrawalNotes ?? ""}
                placeholder="e.g. Illness, changed plans…"
              />
            </div>
            {withdrawState?.error && (
              <p className="text-sm text-destructive">
                {withdrawState.error}
              </p>
            )}
            <Button type="submit" variant="destructive" disabled={isWithdrawing}>
              {isWithdrawing ? "Withdrawing…" : "Confirm withdrawal"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (status === "rejected") {
    return (
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
        Reset to pending
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(() => restoreRegistration(courseId, registrationId))
      }
    >
      Restore to accepted
    </Button>
  );
}
