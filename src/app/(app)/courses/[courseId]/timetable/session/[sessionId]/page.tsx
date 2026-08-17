import Link from "next/link";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  sessions,
  timeSlots,
  courseDays,
  rooms,
  sessionTeachers,
  sessionParticipants,
  sessionPieces,
  documents,
  people,
  skills,
  skillTypes,
} from "@/db/schema";
import { PrintButton } from "@/components/print-button";
import { AddPieceForm } from "./add-piece-form";
import { InstrumentSelector } from "./instrument-selector";
import { PieceRow } from "./piece-row";
import { setParticipantInstrument } from "./actions";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; sessionId: string }>;
}) {
  const { courseId, sessionId } = await params;
  const authSession = await auth();
  if (!authSession?.user) notFound();

  const currentPersonId = authSession.user.personId;
  const role = authSession.user.role;

  // Session info + time slot + day + room
  const [sessionRow] = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
      dayDate: courseDays.date,
      dayLabel: courseDays.label,
      roomName: rooms.name,
    })
    .from(sessions)
    .innerJoin(timeSlots, eq(sessions.timeSlotId, timeSlots.id))
    .innerJoin(courseDays, eq(timeSlots.courseDayId, courseDays.id))
    .leftJoin(rooms, eq(sessions.roomId, rooms.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!sessionRow) notFound();

  // Fetch teachers, participants, pieces (with any attached document) in parallel
  const [teacherRows, participantRows, pieces] = await Promise.all([
    db
      .select({ id: people.id, name: people.name })
      .from(sessionTeachers)
      .innerJoin(people, eq(sessionTeachers.personId, people.id))
      .where(eq(sessionTeachers.sessionId, sessionId))
      .orderBy(people.name),
    db
      .select({
        id: people.id,
        name: people.name,
        skillTypeId: sessionParticipants.skillTypeId,
        skillTypeName: skillTypes.name,
      })
      .from(sessionParticipants)
      .innerJoin(people, eq(sessionParticipants.personId, people.id))
      .leftJoin(skillTypes, eq(sessionParticipants.skillTypeId, skillTypes.id))
      .where(eq(sessionParticipants.sessionId, sessionId))
      .orderBy(people.name),
    db
      .select({
        id: sessionPieces.id,
        title: sessionPieces.title,
        createdAt: sessionPieces.createdAt,
        documentId: documents.id,
        documentFilename: documents.filename,
      })
      .from(sessionPieces)
      .leftJoin(documents, eq(sessionPieces.documentId, documents.id))
      .where(eq(sessionPieces.sessionId, sessionId))
      .orderBy(asc(sessionPieces.createdAt)),
  ]);

  const availableDocuments = await db
    .select({ id: documents.id, filename: documents.filename })
    .from(documents)
    .orderBy(desc(documents.createdAt));

  // Available skills per participant
  const participantIds = participantRows.map((p) => p.id);
  const skillRows =
    participantIds.length > 0
      ? await db
          .select({
            personId: skills.personId,
            skillTypeId: skillTypes.id,
            skillTypeName: skillTypes.name,
          })
          .from(skills)
          .innerJoin(skillTypes, eq(skills.skillTypeId, skillTypes.id))
          .where(inArray(skills.personId, participantIds))
          .orderBy(skillTypes.sortOrder, skillTypes.name)
      : [];

  const skillsByPerson = new Map<string, { id: string; name: string }[]>();
  for (const row of skillRows) {
    const list = skillsByPerson.get(row.personId) ?? [];
    list.push({ id: row.skillTypeId, name: row.skillTypeName });
    skillsByPerson.set(row.personId, list);
  }

  const isOrgOrAdmin = role === "admin" || role === "organiser";
  const canEdit =
    isOrgOrAdmin || teacherRows.some((t) => t.id === currentPersonId);

  const timeLabel = `${sessionRow.startTime.slice(0, 5)}–${sessionRow.endTime.slice(0, 5)}`;
  const dayDisplay = sessionRow.dayLabel
    ? `${sessionRow.dayDate} (${sessionRow.dayLabel})`
    : sessionRow.dayDate;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8 print:block print:space-y-4 print:p-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex gap-3 text-sm text-muted-foreground print:hidden">
            <Link
              href={`/courses/${courseId}/timetable`}
              className="hover:text-foreground"
            >
              ← Timetable
            </Link>
            {teacherRows.some((t) => t.id === currentPersonId) && (
              <Link
                href={`/courses/${courseId}/timetable/teacher/${currentPersonId}`}
                className="hover:text-foreground"
              >
                ← My sessions
              </Link>
            )}
          </div>
          <h1 className="mt-2 text-xl font-semibold">{sessionRow.title}</h1>
          <p className="text-sm text-muted-foreground">
            {dayDisplay} &middot; {timeLabel}
            {sessionRow.roomName && ` · ${sessionRow.roomName}`}
          </p>
          {teacherRows.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {teacherRows.map((t) => t.name).join(", ")}
            </p>
          )}
        </div>
        <PrintButton />
      </div>

      {/* Participants */}
      <section className="print:break-inside-avoid">
        <h2 className="mb-3 font-medium">Participants</h2>
        {participantRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No participants assigned yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {participantRows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 print:break-inside-avoid"
                >
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 text-right">
                    {canEdit ? (
                      <InstrumentSelector
                        personId={p.id}
                        currentSkillTypeId={p.skillTypeId}
                        availableSkillTypes={skillsByPerson.get(p.id) ?? []}
                        action={setParticipantInstrument.bind(
                          null,
                          courseId,
                          sessionId,
                          p.id,
                        )}
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {p.skillTypeName ?? "Not specified"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Pieces */}
      <section className="print:break-inside-avoid">
        <h2 className="mb-3 font-medium">Pieces</h2>
        {pieces.length === 0 && !canEdit && (
          <p className="text-sm text-muted-foreground">No pieces added yet.</p>
        )}
        {pieces.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2 print:block print:space-y-2">
            {pieces.map((piece) =>
              canEdit ? (
                <PieceRow
                  key={piece.id}
                  courseId={courseId}
                  piece={piece}
                  availableDocuments={availableDocuments}
                />
              ) : (
                <li key={piece.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">&bull;</span>
                  <span>{piece.title}</span>
                  {piece.documentId && (
                    <a
                      href={`/documents/${piece.documentId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground underline"
                    >
                      {piece.documentFilename}
                    </a>
                  )}
                </li>
              ),
            )}
          </ul>
        )}
        {canEdit && (
          <div className="print:hidden">
            <AddPieceForm courseId={courseId} sessionId={sessionId} />
          </div>
        )}
      </section>
    </div>
  );
}
