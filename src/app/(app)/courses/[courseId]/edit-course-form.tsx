"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCourse } from "../actions";

type Course = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string | null;
};

export function EditCourseForm({ course }: { course: Course }) {
  const updateCourseWithId = updateCourse.bind(null, course.id);
  const [state, formAction, isPending] = useActionState(
    updateCourseWithId,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={course.name} required />
      </div>
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={course.startDate}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={course.endDate}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="venue">Venue</Label>
        <Input id="venue" name="venue" defaultValue={course.venue ?? ""} />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
