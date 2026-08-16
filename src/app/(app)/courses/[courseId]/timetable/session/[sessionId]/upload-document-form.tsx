"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadDocument } from "./actions";

export function UploadDocumentForm({
  courseId,
  sessionId,
}: {
  courseId: string;
  sessionId: string;
}) {
  const uploadForSession = uploadDocument.bind(null, courseId, sessionId);
  const [state, formAction, isPending] = useActionState(
    uploadForSession,
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
      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
        className="flex-1 text-sm"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Uploading…" : "Upload"}
      </Button>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
