"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePerson } from "../actions";
import { RoleCheckboxes } from "../role-checkboxes";

type Person = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isTeacher: boolean;
  isOrganiser: boolean;
  isAdmin: boolean;
};

export function EditPersonForm({ person }: { person: Person }) {
  const updatePersonWithId = updatePerson.bind(null, person.id);
  const [state, formAction, isPending] = useActionState(
    updatePersonWithId,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={person.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={person.email ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={person.phone ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={person.address ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={person.notes ?? ""} />
      </div>
      <RoleCheckboxes defaults={person} />
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
