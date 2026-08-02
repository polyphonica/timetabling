"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/delete-button";
import { createLogin, deleteLogin, resetPassword } from "../actions";

export function LoginSection({
  personId,
  canHaveLogin,
  existingUser,
}: {
  personId: string;
  canHaveLogin: boolean;
  existingUser: { id: string; username: string } | null;
}) {
  const createLoginForPerson = createLogin.bind(null, personId);
  const [createState, createAction, isCreating] = useActionState(
    createLoginForPerson,
    undefined,
  );
  const [revealedPassword, setRevealedPassword] = useState<string | null>(
    null,
  );
  const [isResetting, startReset] = useTransition();

  // Derive revealed password from the latest action result during render
  // (see https://react.dev/learn/you-might-not-need-an-effect).
  const [lastCreateState, setLastCreateState] = useState(createState);
  if (createState !== lastCreateState) {
    setLastCreateState(createState);
    if (createState?.password) {
      setRevealedPassword(createState.password);
    }
  }

  if (!canHaveLogin) {
    return (
      <p className="text-sm text-muted-foreground">
        Only teachers, organisers, and admins can have a login. Students
        don&apos;t need one.
      </p>
    );
  }

  function handleReset(userId: string) {
    startReset(async () => {
      try {
        const result = await resetPassword(personId, userId);
        if (result?.password) {
          setRevealedPassword(result.password);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Reset failed");
      }
    });
  }

  if (!existingUser) {
    return (
      <form action={createAction} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input name="username" placeholder="Username" required />
          <Button type="submit" disabled={isCreating}>
            Create login
          </Button>
        </div>
        {createState?.error && (
          <p className="text-sm text-destructive">{createState.error}</p>
        )}
        {revealedPassword && (
          <PasswordReveal password={revealedPassword} />
        )}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <span>
          Username: <span className="font-medium">{existingUser.username}</span>
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isResetting}
            onClick={() => handleReset(existingUser.id)}
          >
            Reset password
          </Button>
          <DeleteButton
            action={deleteLogin.bind(null, personId, existingUser.id)}
            label="Remove login"
          />
        </div>
      </div>
      {revealedPassword && <PasswordReveal password={revealedPassword} />}
    </div>
  );
}

function PasswordReveal({ password }: { password: string }) {
  return (
    <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
      <p className="mb-1 text-muted-foreground">
        New password (shown once — copy it now):
      </p>
      <code className="font-mono">{password}</code>
    </div>
  );
}
