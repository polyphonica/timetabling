"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "./session-actions";

type Room = { id: string; name: string };
type Teacher = { id: string; name: string };

export function SessionFormDialog({
  action,
  trigger,
  dialogTitle,
  rooms,
  teachers,
  initial,
}: {
  action: (
    prevState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  trigger: React.ReactElement;
  dialogTitle: string;
  rooms: Room[];
  teachers: Teacher[];
  initial?: { title: string; roomId: string | null; teacherIds: string[] };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, undefined);

  // Close the dialog once a pending submit finishes without an error,
  // regardless of whether the resolved state is referentially "new".
  const [wasPending, setWasPending] = useState(false);
  if (wasPending !== isPending) {
    if (wasPending && !isPending && !state?.error) {
      setOpen(false);
    }
    setWasPending(isPending);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initial?.title}
              placeholder="e.g. Viol consort"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="roomId">Room</Label>
            <select
              id="roomId"
              name="roomId"
              defaultValue={initial?.roomId ?? ""}
              className="h-9 rounded-md border bg-transparent px-2 text-sm"
            >
              <option value="">No room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Teachers</Label>
            {teachers.map((teacher) => (
              <label key={teacher.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="teacherIds"
                  value={teacher.id}
                  defaultChecked={initial?.teacherIds.includes(teacher.id)}
                  className="size-4"
                />
                {teacher.name}
              </label>
            ))}
            {teachers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No teachers yet — add a person flagged as Teacher first.
              </p>
            )}
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
