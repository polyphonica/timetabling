"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInterestType } from "./actions";

export function AddInterestTypeForm() {
  const [state, formAction, isPending] = useActionState(
    createInterestType,
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
        <Input name="name" placeholder="e.g. Lute song" required />
        <Input name="group" placeholder="Group (optional), e.g. Ensemble" />
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
