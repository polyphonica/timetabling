"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/delete-button";
import { addSkill, removeSkill } from "../actions";

type SkillType = { id: string; name: string; group: string | null };
type PersonSkill = {
  id: string;
  skillTypeId: string;
  skillTypeName: string;
  proficiency: string | null;
  notes: string | null;
  studyOrder: number | null;
};

const studyOrderLabels: Record<number, string> = {
  1: "1st study",
  2: "2nd study",
  3: "3rd study",
};

function studyOrderLabel(studyOrder: number | null) {
  if (studyOrder === null) return null;
  return studyOrderLabels[studyOrder] ?? `${studyOrder}th study`;
}

export function SkillsSection({
  personId,
  availableSkillTypes,
  personSkills,
}: {
  personId: string;
  availableSkillTypes: SkillType[];
  personSkills: PersonSkill[];
}) {
  const addSkillForPerson = addSkill.bind(null, personId);
  const [state, formAction, isPending] = useActionState(
    addSkillForPerson,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {personSkills.map((skill) => (
          <li
            key={skill.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              <span className="font-medium">{skill.skillTypeName}</span>
              {studyOrderLabel(skill.studyOrder) && (
                <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {studyOrderLabel(skill.studyOrder)}
                </span>
              )}
              {skill.proficiency && (
                <span className="ml-2 text-muted-foreground">
                  {skill.proficiency}
                </span>
              )}
              {skill.notes && (
                <span className="ml-2 text-muted-foreground">
                  — {skill.notes}
                </span>
              )}
            </span>
            <DeleteButton
              action={removeSkill.bind(null, personId, skill.id)}
            />
          </li>
        ))}
        {personSkills.length === 0 && (
          <p className="text-sm text-muted-foreground">No skills yet.</p>
        )}
      </ul>

      {availableSkillTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No skill types configured yet — add some on the Skill Types page
          first.
        </p>
      ) : (
        <form ref={formRef} action={formAction} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="skillTypeId"
              className="h-9 rounded-md border bg-transparent px-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select instrument/voice...
              </option>
              {availableSkillTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.group ? `${type.group} — ${type.name}` : type.name}
                </option>
              ))}
            </select>
            <select
              name="studyOrder"
              className="h-9 rounded-md border bg-transparent px-2 text-sm"
              defaultValue=""
            >
              <option value="">Unranked</option>
              <option value="1">1st study</option>
              <option value="2">2nd study</option>
              <option value="3">3rd study</option>
            </select>
            <Input
              name="proficiency"
              placeholder="Proficiency (optional)"
              className="w-40"
            />
            <Input
              name="notes"
              placeholder="Notes (optional)"
              className="w-48"
            />
            <Button type="submit" size="sm" disabled={isPending}>
              Add skill
            </Button>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </form>
      )}
    </div>
  );
}
