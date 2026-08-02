"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom } from "./actions";

export function AddRoomForm({ courseId }: { courseId: string }) {
  const createRoomWithCourse = createRoom.bind(null, courseId);
  const [state, formAction, isPending] = useActionState(
    createRoomWithCourse,
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
        <Input name="name" placeholder="Room name" required />
        <Button type="submit" disabled={isPending}>
          Add
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
