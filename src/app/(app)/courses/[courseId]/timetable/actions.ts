"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { sessions, sessionParticipants, people } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";
import {
  getOverlappingSessions,
  getPeopleInSessions,
  findPersonConflict,
} from "@/lib/conflicts";

export type ParticipantActionResult = { error?: string } | undefined;

export async function addParticipant(
  courseId: string,
  sessionId: string,
  personId: string,
): Promise<ParticipantActionResult> {
  await requireOrganiserOrAdmin();

  const [session] = await db
    .select({ timeSlotId: sessions.timeSlotId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!session) {
    return { error: "Session no longer exists." };
  }

  const overlapping = await getOverlappingSessions(session.timeSlotId, sessionId);
  const peopleInSessions = await getPeopleInSessions(overlapping.map((s) => s.id));
  const conflict = findPersonConflict(overlapping, peopleInSessions, personId);
  if (conflict) {
    const [person] = await db
      .select({ name: people.name })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);
    return {
      error: `${person?.name ?? "That person"} is already assigned to "${conflict.title}" at this time.`,
    };
  }

  await db
    .insert(sessionParticipants)
    .values({ sessionId, personId })
    .onConflictDoNothing();

  revalidatePath(`/courses/${courseId}/timetable`);
  return undefined;
}

export async function removeParticipant(
  courseId: string,
  sessionId: string,
  personId: string,
) {
  await requireOrganiserOrAdmin();
  await db
    .delete(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.personId, personId),
      ),
    );
  revalidatePath(`/courses/${courseId}/timetable`);
}
