"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";
import { X } from "lucide-react";
import type { SessionInfo } from "@/lib/timetable-data";
import { MessageThreadDialog } from "@/components/message-thread-dialog";
import { removeParticipant } from "./actions";

export function SessionCell({
  session,
  mode,
  canEdit,
  courseId,
  currentPersonId,
}: {
  session: SessionInfo;
  mode: "room" | "teacher";
  canEdit: boolean;
  courseId: string;
  currentPersonId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { setNodeRef, isOver } = useDroppable({
    id: `session:${session.id}`,
    disabled: !canEdit,
  });

  function handleRemove(personId: string) {
    startTransition(async () => {
      await removeParticipant(courseId, session.id, personId);
      router.refresh();
    });
  }

  const secondary =
    mode === "room"
      ? session.teachers.map((t) => t.name).join(", ")
      : session.roomName;

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-16 flex-col gap-1 rounded-md border p-1.5 text-xs transition-colors ${
        isOver ? "bg-accent ring-2 ring-primary" : "bg-background"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="font-medium">{session.title}</div>
        <MessageThreadDialog
          sessionId={session.id}
          sessionTitle={session.title}
          initialCount={session.messageCount}
          currentPersonId={currentPersonId}
        />
      </div>
      {secondary && <div className="text-muted-foreground">{secondary}</div>}
      <div className="flex flex-wrap gap-1">
        {session.participants.map((p) => (
          <span
            key={p.id}
            className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5"
          >
            {p.name}
            {canEdit && (
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                className="text-muted-foreground hover:text-foreground print:hidden"
                aria-label={`Remove ${p.name}`}
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
