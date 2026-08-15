"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reopenCourse } from "../actions";

export function CourseClosedBanner({
  courseId,
  canReopen,
}: {
  courseId: string;
  canReopen: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive print:hidden">
      <span>This course has ended and is now read-only.</span>
      {canReopen && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await reopenCourse(courseId);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Couldn't reopen.");
              }
            })
          }
        >
          {isPending ? "Reopening…" : "Reopen"}
        </Button>
      )}
    </div>
  );
}
