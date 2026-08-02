"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSkillType } from "./actions";

export function AddSkillTypeForm() {
  const [state, formAction, isPending] = useActionState(
    createSkillType,
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
        <Input name="name" placeholder="e.g. Soprano Viol" required />
        <Input name="group" placeholder="Group (optional), e.g. Viol" />
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
