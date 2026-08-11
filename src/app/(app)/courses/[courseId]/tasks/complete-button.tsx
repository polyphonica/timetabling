"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CompleteButton({
  action,
  isComplete,
}: {
  action: () => Promise<void>;
  isComplete: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => action())}
    >
      {isComplete ? "Undo" : "Complete"}
    </Button>
  );
}
