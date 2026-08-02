"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTimeSlot } from "./actions";

export function AddSlotForm({
  courseId,
  courseDayId,
}: {
  courseId: string;
  courseDayId: string;
}) {
  const createTimeSlotForDay = createTimeSlot.bind(null, courseId, courseDayId);
  const [state, formAction, isPending] = useActionState(
    createTimeSlotForDay,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input name="startTime" type="time" required className="w-32" />
        <span className="text-sm text-muted-foreground">to</span>
        <Input name="endTime" type="time" required className="w-32" />
        <select
          name="kind"
          defaultValue="session"
          className="h-9 rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="session">Session</option>
          <option value="break">Break</option>
        </select>
        <Input
          name="label"
          placeholder="Label (optional), e.g. Lunch"
          className="w-48"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          Add
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
