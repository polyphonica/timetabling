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
import { createCourse } from "./actions";

export function CreateCourseDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCourse, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>New course</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New course</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Higham Hall Early Music Course 2027"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" name="venue" placeholder="Higham Hall" />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create course"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
