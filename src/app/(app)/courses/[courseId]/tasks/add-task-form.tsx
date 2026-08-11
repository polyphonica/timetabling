"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createTask } from "./actions";

export function AddTaskForm({ courseId }: { courseId: string }) {
  const createTaskForCourse = createTask.bind(null, courseId);
  const [state, formAction, isPending] = useActionState(
    createTaskForCourse,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Task</Label>
        <Input id="title" name="title" placeholder="e.g. Follow up Jane re Monday session" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Notes (optional)</Label>
        <Textarea id="description" name="description" placeholder="Additional details..." rows={2} />
      </div>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Due date (optional)</Label>
          <Input id="dueDate" name="dueDate" type="date" className="w-40" />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add task"}
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
