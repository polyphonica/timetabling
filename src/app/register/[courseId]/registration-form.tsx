"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { registerStudent } from "./actions";

type SkillType = { id: string; name: string; group: string | null };

export function RegistrationForm({
  courseId,
  skillTypes,
}: {
  courseId: string;
  skillTypes: SkillType[];
}) {
  const registerForCourse = registerStudent.bind(null, courseId);
  const [state, formAction, isPending] = useActionState(
    registerForCourse,
    undefined,
  );

  if (state?.success) {
    return (
      <div className="rounded-lg border p-4 text-sm">
        Thank you — your details have been submitted. The organiser will be
        in touch about your session times.
      </div>
    );
  }

  const groups = new Map<string, SkillType[]>();
  for (const type of skillTypes) {
    const key = type.group ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(type);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" type="tel" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Instruments / voices</Label>
        {[...groups.entries()].map(([group, types]) => (
          <div key={group} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {group}
            </span>
            <div className="flex flex-col gap-1.5 pl-1">
              {types.map((type) => (
                <label
                  key={type.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="skillTypeIds"
                    value={type.id}
                    className="size-4"
                  />
                  {type.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Anything you'd like the organiser to know..."
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </Button>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
