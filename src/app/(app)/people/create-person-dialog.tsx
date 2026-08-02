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
import { createPerson } from "./actions";
import { RoleCheckboxes } from "./role-checkboxes";

export function CreatePersonDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPerson, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>New person</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New person</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <RoleCheckboxes />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create person"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
