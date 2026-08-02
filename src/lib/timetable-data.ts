import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  courseDays,
  timeSlots,
  rooms,
  people,
  skills,
  skillTypes,
  sessions,
  sessionTeachers,
  sessionParticipants,
} from "@/db/schema";
import { getMessageCounts } from "@/lib/messaging";

export type SessionInfo = {
  id: string;
  title: string;
  roomId: string | null;
  roomName: string | null;
  teachers: { id: string; name: string }[];
  participants: { id: string; name: string }[];
  messageCount: number;
};

export type SlotInfo = {
  id: string;
  startTime: string;
  endTime: string;
  kind: "session" | "break";
  label: string | null;
  sessions: SessionInfo[];
};

export type DayInfo = {
  id: string;
  date: string;
  label: string | null;
  slots: SlotInfo[];
};

export type CourseTimetable = {
  days: DayInfo[];
  rooms: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  students: { id: string; name: string; skills: string[] }[];
};

const superscriptDigits = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

function formatSkillLabel(name: string, studyOrder: number | null) {
  if (studyOrder === null) return name;
  const suffix = String(studyOrder)
    .split("")
    .map((digit) => superscriptDigits[Number(digit)])
    .join("");
  return `${name}${suffix}`;
}

export async function getCourseTimetable(
  courseId: string,
): Promise<CourseTimetable> {
  const [days, courseRooms, teachers, students] = await Promise.all([
    db
      .select()
      .from(courseDays)
      .where(eq(courseDays.courseId, courseId))
      .orderBy(courseDays.date),
    db
      .select({ id: rooms.id, name: rooms.name })
      .from(rooms)
      .where(eq(rooms.courseId, courseId))
      .orderBy(rooms.name),
    db
      .select({ id: people.id, name: people.name })
      .from(people)
      .where(eq(people.isTeacher, true))
      .orderBy(people.name),
    db
      .select({ id: people.id, name: people.name })
      .from(people)
      .where(
        and(
          eq(people.isTeacher, false),
          eq(people.isOrganiser, false),
          eq(people.isAdmin, false),
        ),
      )
      .orderBy(people.name),
  ]);

  const studentSkillRows =
    students.length > 0
      ? await db
          .select({
            personId: skills.personId,
            skillTypeName: skillTypes.name,
            studyOrder: skills.studyOrder,
          })
          .from(skills)
          .innerJoin(skillTypes, eq(skills.skillTypeId, skillTypes.id))
          .where(
            inArray(
              skills.personId,
              students.map((s) => s.id),
            ),
          )
          .orderBy(skills.studyOrder, skillTypes.sortOrder, skillTypes.name)
      : [];

  const studentsWithSkills = students.map((student) => ({
    ...student,
    skills: studentSkillRows
      .filter((row) => row.personId === student.id)
      .map((row) => formatSkillLabel(row.skillTypeName, row.studyOrder)),
  }));

  if (days.length === 0) {
    return { days: [], rooms: courseRooms, teachers, students: studentsWithSkills };
  }

  const dayIds = days.map((d) => d.id);
  const slots = await db
    .select()
    .from(timeSlots)
    .where(inArray(timeSlots.courseDayId, dayIds))
    .orderBy(timeSlots.startTime);

  const slotIds = slots.map((s) => s.id);
  const slotSessions =
    slotIds.length > 0
      ? await db
          .select({
            id: sessions.id,
            title: sessions.title,
            timeSlotId: sessions.timeSlotId,
            roomId: sessions.roomId,
            roomName: rooms.name,
          })
          .from(sessions)
          .leftJoin(rooms, eq(sessions.roomId, rooms.id))
          .where(inArray(sessions.timeSlotId, slotIds))
      : [];

  const sessionIds = slotSessions.map((s) => s.id);
  const [teacherRows, participantRows, messageCounts] =
    sessionIds.length > 0
      ? await Promise.all([
          db
            .select({
              sessionId: sessionTeachers.sessionId,
              personId: sessionTeachers.personId,
              name: people.name,
            })
            .from(sessionTeachers)
            .innerJoin(people, eq(sessionTeachers.personId, people.id))
            .where(inArray(sessionTeachers.sessionId, sessionIds)),
          db
            .select({
              sessionId: sessionParticipants.sessionId,
              personId: sessionParticipants.personId,
              name: people.name,
            })
            .from(sessionParticipants)
            .innerJoin(people, eq(sessionParticipants.personId, people.id))
            .where(inArray(sessionParticipants.sessionId, sessionIds)),
          getMessageCounts(sessionIds),
        ])
      : [[], [], {} as Record<string, number>];

  const sessionsBySlot = new Map<string, SessionInfo[]>();
  for (const s of slotSessions) {
    const info: SessionInfo = {
      id: s.id,
      title: s.title,
      roomId: s.roomId,
      roomName: s.roomName,
      teachers: teacherRows
        .filter((t) => t.sessionId === s.id)
        .map((t) => ({ id: t.personId, name: t.name })),
      participants: participantRows
        .filter((p) => p.sessionId === s.id)
        .map((p) => ({ id: p.personId, name: p.name })),
      messageCount: messageCounts[s.id] ?? 0,
    };
    const list = sessionsBySlot.get(s.timeSlotId) ?? [];
    list.push(info);
    sessionsBySlot.set(s.timeSlotId, list);
  }

  const slotsByDay = new Map<string, SlotInfo[]>();
  for (const slot of slots) {
    const info: SlotInfo = {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      kind: slot.kind,
      label: slot.label,
      sessions: sessionsBySlot.get(slot.id) ?? [],
    };
    const list = slotsByDay.get(slot.courseDayId) ?? [];
    list.push(info);
    slotsByDay.set(slot.courseDayId, list);
  }

  return {
    days: days.map((d) => ({
      id: d.id,
      date: d.date,
      label: d.label,
      slots: slotsByDay.get(d.id) ?? [],
    })),
    rooms: courseRooms,
    teachers,
    students: studentsWithSkills,
  };
}
