"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDay } from "./actions";

export function AddDayForm({ courseId }: { courseId: string }) {
  const createDayWithCourse = createDay.bind(null, courseId);
  const [state, formAction, isPending] = useActionState(
    createDayWithCourse,
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
      <div className="flex gap-2">
        <Input name="date" type="date" required />
        <Input name="label" placeholder="Label (optional), e.g. Monday" />
        <Button type="submit" disabled={isPending}>
          Add day
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
