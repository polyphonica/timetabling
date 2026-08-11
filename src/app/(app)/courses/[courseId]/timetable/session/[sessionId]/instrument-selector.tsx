"use client";

import { useTransition } from "react";

type SkillType = { id: string; name: string };

export function InstrumentSelector({
  personId,
  currentSkillTypeId,
  availableSkillTypes,
  action,
}: {
  personId: string;
  currentSkillTypeId: string | null;
  availableSkillTypes: SkillType[];
  action: (skillTypeId: string | null) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentSkillTypeId ?? ""}
      disabled={isPending}
      onChange={(e) => {
        const val = e.target.value || null;
        startTransition(() => action(val));
      }}
      className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">Not specified</option>
      {availableSkillTypes.map((st) => (
        <option key={st.id} value={st.id}>
          {st.name}
        </option>
      ))}
    </select>
  );
}
