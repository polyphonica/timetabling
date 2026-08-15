"use server";

import { z } from "zod";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  courseRegistrations,
  people,
  sessions,
  sessionParticipants,
  timeSlots,
  courseDays,
} from "@/db/schema";
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

const withdrawSchema = z.object({
  notes: z.string().optional(),
});

// Withdrawing removes the student from every session they're already
// scheduled into for this course — unlike rejection, an accepted student
// may already be on teachers' printed registers, so leaving stale
// assignments in place is a real problem, not just a UI wrinkle.
export async function withdrawRegistration(
  courseId: string,
  registrationId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);

  const parsed = withdrawSchema.safeParse({
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const [registration] = await db
    .select({ personId: courseRegistrations.personId })
    .from(courseRegistrations)
    .where(eq(courseRegistrations.id, registrationId))
    .limit(1);
  if (!registration) {
    return { error: "Registration not found." };
  }

  const courseSessionIds = db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(timeSlots, eq(sessions.timeSlotId, timeSlots.id))
    .innerJoin(courseDays, eq(timeSlots.courseDayId, courseDays.id))
    .where(eq(courseDays.courseId, courseId));

  await db
    .delete(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.personId, registration.personId),
        inArray(sessionParticipants.sessionId, courseSessionIds),
      ),
    );

  await db
    .update(courseRegistrations)
    .set({
      status: "withdrawn",
      withdrawalNotes: parsed.data.notes?.trim() || null,
      rejectionReason: null,
      rejectionNotes: null,
    })
    .where(eq(courseRegistrations.id, registrationId));

  revalidatePath(`/courses/${courseId}/registrations`);
  revalidatePath(`/courses/${courseId}/timetable`);
  return undefined;
}

export async function restoreRegistration(
  courseId: string,
  registrationId: string,
) {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);
  await db
    .update(courseRegistrations)
    .set({ status: "accepted", withdrawalNotes: null })
    .where(eq(courseRegistrations.id, registrationId));
  revalidatePath(`/courses/${courseId}/registrations`);
  revalidatePath(`/courses/${courseId}/timetable`);
}

// Sessions currently assigned per person for this course, so the
// Withdraw dialog can warn how many placements it's about to clear.
export async function getSessionCounts(
  courseId: string,
): Promise<Record<string, number>> {
  await requireOrganiserOrAdmin();

  const rows = await db
    .select({
      personId: sessionParticipants.personId,
      count: sql<number>`count(${sessionParticipants.sessionId})`.mapWith(
        Number,
      ),
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessionParticipants.sessionId, sessions.id))
    .innerJoin(timeSlots, eq(sessions.timeSlotId, timeSlots.id))
    .innerJoin(courseDays, eq(timeSlots.courseDayId, courseDays.id))
    .where(eq(courseDays.courseId, courseId))
    .groupBy(sessionParticipants.personId);

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.personId] = row.count;
  return counts;
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
