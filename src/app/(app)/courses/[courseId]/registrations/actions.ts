"use server";

import { z } from "zod";
import { and, eq, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { courseRegistrations, people } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";
import { requireCourseOpen } from "@/lib/course-status";

export type ActionState = { error?: string } | undefined;

export async function acceptRegistration(
  courseId: string,
  registrationId: string,
) {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);
  await db
    .update(courseRegistrations)
    .set({ status: "accepted", rejectionReason: null, rejectionNotes: null })
    .where(eq(courseRegistrations.id, registrationId));
  revalidatePath(`/courses/${courseId}/registrations`);
  revalidatePath(`/courses/${courseId}/timetable`);
}

export async function resetRegistrationToPending(
  courseId: string,
  registrationId: string,
) {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);
  await db
    .update(courseRegistrations)
    .set({ status: "pending", rejectionReason: null, rejectionNotes: null })
    .where(eq(courseRegistrations.id, registrationId));
  revalidatePath(`/courses/${courseId}/registrations`);
  revalidatePath(`/courses/${courseId}/timetable`);
}

const rejectSchema = z
  .object({
    reason: z.enum(["course_full", "inexperienced", "other"], {
      message: "Choose a reason",
    }),
    notes: z.string().optional(),
  })
  .refine((data) => data.reason !== "other" || !!data.notes?.trim(), {
    message: "Add a note explaining the reason",
    path: ["notes"],
  });

export async function rejectRegistration(
  courseId: string,
  registrationId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);

  const parsed = rejectSchema.safeParse({
    reason: formData.get("reason"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db
    .update(courseRegistrations)
    .set({
      status: "rejected",
      rejectionReason: parsed.data.reason,
      rejectionNotes:
        parsed.data.reason === "other" ? (parsed.data.notes ?? null) : null,
    })
    .where(eq(courseRegistrations.id, registrationId));

  revalidatePath(`/courses/${courseId}/registrations`);
  revalidatePath(`/courses/${courseId}/timetable`);
  return undefined;
}

export async function getUnregisteredPeople(courseId: string) {
  await requireOrganiserOrAdmin();

  const existing = await db
    .select({ personId: courseRegistrations.personId })
    .from(courseRegistrations)
    .where(eq(courseRegistrations.courseId, courseId));
  const existingIds = existing.map((r) => r.personId);

  return db
    .select({ id: people.id, name: people.name })
    .from(people)
    .where(
      and(
        eq(people.isTeacher, false),
        eq(people.isOrganiser, false),
        eq(people.isAdmin, false),
        existingIds.length > 0 ? notInArray(people.id, existingIds) : undefined,
      ),
    )
    .orderBy(people.name);
}

const registerSchema = z.object({
  personId: z.string().min(1, "Choose a person"),
});

export async function registerExistingPerson(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);

  const parsed = registerSchema.safeParse({
    personId: formData.get("personId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(courseRegistrations).values({
    courseId,
    personId: parsed.data.personId,
  });

  revalidatePath(`/courses/${courseId}/registrations`);
  return undefined;
}
