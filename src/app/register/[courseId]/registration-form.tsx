"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { registerStudent } from "./actions";

type NamedGroupedType = { id: string; name: string; group: string | null };

function groupByGroup(types: NamedGroupedType[]) {
  const groups = new Map<string, NamedGroupedType[]>();
  for (const type of types) {
    const key = type.group ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(type);
  }
  return groups;
}

export function RegistrationForm({
  courseId,
  skillTypes,
  interestTypes,
}: {
  courseId: string;
  skillTypes: NamedGroupedType[];
  interestTypes: NamedGroupedType[];
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

  const groups = groupByGroup(skillTypes);
  const interestGroups = groupByGroup(interestTypes);

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

      {interestTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>What would you like to be involved in?</Label>
          <p className="text-sm text-muted-foreground">
            Select any activities or ensembles you&apos;re interested in —
            this helps the organiser place you in sessions.
          </p>
          {[...interestGroups.entries()].map(([group, types]) => (
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
                      name="interestTypeIds"
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
      )}

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
