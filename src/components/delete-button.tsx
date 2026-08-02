"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  label = "Remove",
  confirmMessage,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        unstable_rethrow(err);
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {label}
    </Button>
  );
}
