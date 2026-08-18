"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";
import { registerStudent } from "./actions";

type NamedGroupedType = { id: string; name: string; group: string | null };

type ReviewSnapshot = {
  name: string;
  email: string;
  phone: string;
  notes: string;
  skillNames: string[];
  interestNames: string[];
};

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

  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"edit" | "review">("edit");
  const [reviewData, setReviewData] = useState<ReviewSnapshot | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);

  const skillTypesById = useMemo(
    () => new Map(skillTypes.map((t) => [t.id, t])),
    [skillTypes],
  );
  const interestTypesById = useMemo(
    () => new Map(interestTypes.map((t) => [t.id, t])),
    [interestTypes],
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

  function handleContinue() {
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;

    const fd = new FormData(formRef.current);
    const skillIds = fd.getAll("skillTypeIds") as string[];
    if (skillIds.length === 0) {
      setClientError("Select at least one instrument");
      return;
    }
    setClientError(null);

    const interestIds = fd.getAll("interestTypeIds") as string[];
    setReviewData({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      skillNames: skillIds.map((id) => skillTypesById.get(id)?.name ?? id),
      interestNames: interestIds.map(
        (id) => interestTypesById.get(id)?.name ?? id,
      ),
    });
    setMode("review");
  }

  function handleEdit() {
    if (formRef.current) {
      const fd = new FormData(formRef.current);
      const checkedSkillIds = new Set(fd.getAll("skillTypeIds") as string[]);
      const groupsWithSelections = [...groups.entries()]
        .filter(([, types]) => types.some((t) => checkedSkillIds.has(t.id)))
        .map(([group]) => group);
      setOpenGroups(groupsWithSelections);
    }
    setMode("edit");
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div hidden={mode === "review"} className="flex flex-col gap-4">
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
          <Accordion
            value={openGroups}
            onValueChange={(value) => setOpenGroups(value as string[])}
            multiple
            keepMounted
          >
            {[...groups.entries()].map(([group, types]) => (
              <AccordionItem key={group} value={group}>
                <AccordionTrigger>{group}</AccordionTrigger>
                <AccordionPanel>
                  <div className="flex flex-col gap-2 pl-1">
                    {types.map((type) => (
                      <div key={type.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`skill-${type.id}`}
                          name="skillTypeIds"
                          value={type.id}
                        />
                        <Label
                          htmlFor={`skill-${type.id}`}
                          className="font-normal"
                        >
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
          {clientError && (
            <p className="text-sm text-destructive">{clientError}</p>
          )}
        </div>

        {interestTypes.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>What would you like to be involved in?</Label>
            <p className="text-sm text-muted-foreground">
              Select any activities or ensembles you&apos;re interested in —
              this helps the organiser place you in sessions.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Every effort is made to accommodate your wishes, but not all
              choices are possible.
            </p>
            {[...interestGroups.entries()].map(([group, types]) => (
              <div key={group} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {group}
                </span>
                <div className="flex flex-col gap-2 pl-1">
                  {types.map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`interest-${type.id}`}
                        name="interestTypeIds"
                        value={type.id}
                      />
                      <Label
                        htmlFor={`interest-${type.id}`}
                        className="font-normal"
                      >
                        {type.name}
                      </Label>
                    </div>
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

        <Button type="button" onClick={handleContinue}>
          Continue to review
        </Button>
      </div>

      {mode === "review" && reviewData && (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <div>
            <h2 className="text-sm font-medium">Review your details</h2>
            <p className="text-sm text-muted-foreground">
              Check everything below is correct before submitting.
            </p>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="font-medium">Full name</dt>
              <dd className="text-muted-foreground">{reviewData.name}</dd>
            </div>
            <div>
              <dt className="font-medium">Email address</dt>
              <dd className="text-muted-foreground">{reviewData.email}</dd>
            </div>
            <div>
              <dt className="font-medium">Phone number</dt>
              <dd className="text-muted-foreground">{reviewData.phone}</dd>
            </div>
            <div>
              <dt className="font-medium">Instruments / voices</dt>
              <dd className="text-muted-foreground">
                {reviewData.skillNames.join(", ")}
              </dd>
            </div>
            {reviewData.interestNames.length > 0 && (
              <div>
                <dt className="font-medium">What you&apos;d like to be involved in</dt>
                <dd className="text-muted-foreground">
                  {reviewData.interestNames.join(", ")}
                </dd>
              </div>
            )}
            {reviewData.notes && (
              <div>
                <dt className="font-medium">Notes</dt>
                <dd className="text-muted-foreground">{reviewData.notes}</dd>
              </div>
            )}
          </dl>

          <div className="flex items-center gap-2">
            <Checkbox id="privacyAccepted" name="privacyAccepted" required />
            <Label htmlFor="privacyAccepted" className="font-normal">
              I have read and agree to the{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                privacy notice
              </a>
            </Label>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleEdit}>
              Edit
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit registration"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
