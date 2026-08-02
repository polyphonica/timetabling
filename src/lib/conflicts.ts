import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  sessions,
  timeSlots,
  rooms,
  sessionTeachers,
  sessionParticipants,
} from "@/db/schema";

export type OverlappingSession = {
  id: string;
  title: string;
  roomId: string | null;
  roomName: string | null;
  startTime: string;
  endTime: string;
};

// Sessions on the same course day whose time slot overlaps the given slot,
// excluding the session currently being edited (if any). Used to check both
// room and person (teacher/participant) double-booking.
export async function getOverlappingSessions(
  timeSlotId: string,
  excludeSessionId?: string,
): Promise<OverlappingSession[]> {
  const [targetSlot] = await db
    .select({
      courseDayId: timeSlots.courseDayId,
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
    })
    .from(timeSlots)
    .where(eq(timeSlots.id, timeSlotId))
    .limit(1);

  if (!targetSlot) return [];

  const candidates = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      roomId: sessions.roomId,
      roomName: rooms.name,
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
      courseDayId: timeSlots.courseDayId,
    })
    .from(sessions)
    .innerJoin(timeSlots, eq(sessions.timeSlotId, timeSlots.id))
    .leftJoin(rooms, eq(sessions.roomId, rooms.id))
    .where(eq(timeSlots.courseDayId, targetSlot.courseDayId));

  return candidates.filter(
    (c) =>
      c.id !== excludeSessionId &&
      c.startTime < targetSlot.endTime &&
      targetSlot.startTime < c.endTime,
  );
}

export function findRoomConflict(
  overlapping: OverlappingSession[],
  roomId: string | null,
): OverlappingSession | null {
  if (!roomId) return null;
  return overlapping.find((s) => s.roomId === roomId) ?? null;
}

// For each overlapping session, which people (teachers + participants) are
// assigned to it. Used to detect a person being double-booked.
export async function getPeopleInSessions(
  sessionIds: string[],
): Promise<Map<string, Set<string>>> {
  const bySession = new Map<string, Set<string>>();
  if (sessionIds.length === 0) return bySession;

  const [teacherRows, participantRows] = await Promise.all([
    db
      .select({
        sessionId: sessionTeachers.sessionId,
        personId: sessionTeachers.personId,
      })
      .from(sessionTeachers)
      .where(inArray(sessionTeachers.sessionId, sessionIds)),
    db
      .select({
        sessionId: sessionParticipants.sessionId,
        personId: sessionParticipants.personId,
      })
      .from(sessionParticipants)
      .where(inArray(sessionParticipants.sessionId, sessionIds)),
  ]);

  for (const row of [...teacherRows, ...participantRows]) {
    const set = bySession.get(row.sessionId) ?? new Set<string>();
    set.add(row.personId);
    bySession.set(row.sessionId, set);
  }

  return bySession;
}

export function findPersonConflict(
  overlapping: OverlappingSession[],
  peopleInSessions: Map<string, Set<string>>,
  personId: string,
): OverlappingSession | null {
  return (
    overlapping.find((s) => peopleInSessions.get(s.id)?.has(personId)) ?? null
  );
}
