"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, sessionTeachers, people } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";
import {
  getOverlappingSessions,
  getPeopleInSessions,
  findRoomConflict,
  findPersonConflict,
} from "@/lib/conflicts";

export type ActionState = { error?: string } | undefined;

const sessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  roomId: z.string().optional(),
  teacherIds: z.array(z.string()),
});

function parseSessionForm(formData: FormData) {
  return sessionSchema.safeParse({
    title: formData.get("title"),
    roomId: formData.get("roomId") || undefined,
    teacherIds: formData.getAll("teacherIds"),
  });
}

async function checkConflicts(
  timeSlotId: string,
  roomId: string | undefined,
  teacherIds: string[],
  excludeSessionId?: string,
): Promise<string | null> {
  const overlapping = await getOverlappingSessions(
    timeSlotId,
    excludeSessionId,
  );

  const roomConflict = findRoomConflict(overlapping, roomId ?? null);
  if (roomConflict) {
    return `Room already booked for "${roomConflict.title}" (${roomConflict.startTime.slice(0, 5)}–${roomConflict.endTime.slice(0, 5)}) at this time.`;
  }

  if (teacherIds.length > 0) {
    const peopleInSessions = await getPeopleInSessions(
      overlapping.map((s) => s.id),
    );
    for (const teacherId of teacherIds) {
      const conflict = findPersonConflict(
        overlapping,
        peopleInSessions,
        teacherId,
      );
      if (conflict) {
        const [teacher] = await db
          .select({ name: people.name })
          .from(people)
          .where(eq(people.id, teacherId))
          .limit(1);
        return `${teacher?.name ?? "That teacher"} is already assigned to "${conflict.title}" at this time.`;
      }
    }
  }

  return null;
}

export async function createSession(
  courseId: string,
  timeSlotId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = parseSessionForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { title, roomId, teacherIds } = parsed.data;

  const conflictError = await checkConflicts(timeSlotId, roomId, teacherIds);
  if (conflictError) {
    return { error: conflictError };
  }

  const [session] = await db
    .insert(sessions)
    .values({ timeSlotId, roomId: roomId ?? null, title })
    .returning({ id: sessions.id });

  if (teacherIds.length > 0) {
    await db
      .insert(sessionTeachers)
      .values(teacherIds.map((personId) => ({ sessionId: session.id, personId })));
  }

  revalidatePath(`/courses/${courseId}/days`);
  return undefined;
}

export async function updateSession(
  courseId: string,
  sessionId: string,
  timeSlotId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = parseSessionForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { title, roomId, teacherIds } = parsed.data;

  const conflictError = await checkConflicts(
    timeSlotId,
    roomId,
    teacherIds,
    sessionId,
  );
  if (conflictError) {
    return { error: conflictError };
  }

  await db
    .update(sessions)
    .set({ title, roomId: roomId ?? null })
    .where(eq(sessions.id, sessionId));

  await db
    .delete(sessionTeachers)
    .where(eq(sessionTeachers.sessionId, sessionId));
  if (teacherIds.length > 0) {
    await db
      .insert(sessionTeachers)
      .values(teacherIds.map((personId) => ({ sessionId, personId })));
  }

  revalidatePath(`/courses/${courseId}/days`);
  return undefined;
}

export async function deleteSession(courseId: string, sessionId: string) {
  await requireOrganiserOrAdmin();
  await db.delete(sessions).where(eq(sessions.id, sessionId));
  revalidatePath(`/courses/${courseId}/days`);
}
