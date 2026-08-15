"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { registerExistingPerson } from "./actions";

export function AddRegistrationForm({
  courseId,
  people,
}: {
  courseId: string;
  people: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    registerExistingPerson.bind(null, courseId),
    undefined,
  );

  if (people.length === 0) {
    return null;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          name="personId"
          required
          defaultValue=""
          className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Register an existing person…
          </option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isPending}>
          Register
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
