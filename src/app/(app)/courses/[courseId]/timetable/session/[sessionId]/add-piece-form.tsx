"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPiece } from "./actions";

export function AddPieceForm({
  courseId,
  sessionId,
}: {
  courseId: string;
  sessionId: string;
}) {
  const addPieceForSession = addPiece.bind(null, courseId, sessionId);
  const [state, formAction, isPending] = useActionState(
    addPieceForSession,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex items-center gap-2"
    >
      <Input
        name="title"
        placeholder="e.g. Dowland – Flow my tears"
        required
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adding…" : "Add piece"}
      </Button>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
