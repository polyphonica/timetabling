import Link from "next/link";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
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
  sessionDocuments,
  documents,
  people,
  skills,
  skillTypes,
} from "@/db/schema";
import { DeleteButton } from "@/components/delete-button";
import { PrintButton } from "@/components/print-button";
import { AddPieceForm } from "./add-piece-form";
import { InstrumentSelector } from "./instrument-selector";
import { UploadDocumentForm } from "./upload-document-form";
import { AttachExistingDocument } from "./attach-existing-document";
import {
  setParticipantInstrument,
  deletePiece,
  unattachDocument,
} from "./actions";

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

  // Fetch teachers, participants, pieces, documents in parallel
  const [teacherRows, participantRows, pieces, attachedDocuments] = await Promise.all([
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
      .select()
      .from(sessionPieces)
      .where(eq(sessionPieces.sessionId, sessionId))
      .orderBy(asc(sessionPieces.createdAt)),
    db
      .select({
        sessionDocumentId: sessionDocuments.id,
        documentId: documents.id,
        filename: documents.filename,
      })
      .from(sessionDocuments)
      .innerJoin(documents, eq(sessionDocuments.documentId, documents.id))
      .where(eq(sessionDocuments.sessionId, sessionId))
      .orderBy(asc(sessionDocuments.createdAt)),
  ]);

  const attachedDocumentIds = attachedDocuments.map((d) => d.documentId);
  const allDocuments = await db
    .select({ id: documents.id, filename: documents.filename })
    .from(documents)
    .orderBy(desc(documents.createdAt));
  const attachedIdSet = new Set(attachedDocumentIds);
  const availableDocuments = allDocuments.filter((d) => !attachedIdSet.has(d.id));

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
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
      <section>
        <h2 className="mb-3 font-medium">Participants</h2>
        {participantRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No participants assigned yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {participantRows.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
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
      <section>
        <h2 className="mb-3 font-medium">Pieces</h2>
        {pieces.length === 0 && !canEdit && (
          <p className="text-sm text-muted-foreground">No pieces added yet.</p>
        )}
        {pieces.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1">
            {pieces.map((piece) => (
              <li
                key={piece.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-sm">
                  <span className="mr-2 text-muted-foreground">&bull;</span>
                  {piece.title}
                </span>
                {canEdit && (
                  <span className="print:hidden">
                    <DeleteButton
                      action={deletePiece.bind(null, courseId, piece.id)}
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEdit && (
          <div className="print:hidden">
            <AddPieceForm courseId={courseId} sessionId={sessionId} />
          </div>
        )}
      </section>

      {/* Documents */}
      <section className="print:hidden">
        <h2 className="mb-3 font-medium">Documents</h2>
        {attachedDocuments.length === 0 && !canEdit && (
          <p className="text-sm text-muted-foreground">
            No documents added yet.
          </p>
        )}
        {attachedDocuments.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1">
            {attachedDocuments.map((doc) => (
              <li
                key={doc.sessionDocumentId}
                className="flex items-center justify-between gap-2"
              >
                <a
                  href={`/documents/${doc.documentId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline"
                >
                  {doc.filename}
                </a>
                {canEdit && (
                  <DeleteButton
                    action={unattachDocument.bind(
                      null,
                      courseId,
                      sessionId,
                      doc.sessionDocumentId,
                    )}
                    label="Remove"
                    confirmMessage="Remove this document from this session? It stays available in the document library and on any other session it's attached to."
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {canEdit && (
          <div className="flex flex-col gap-3">
            <UploadDocumentForm courseId={courseId} sessionId={sessionId} />
            <AttachExistingDocument
              courseId={courseId}
              sessionId={sessionId}
              availableDocuments={availableDocuments}
            />
          </div>
        )}
      </section>
    </div>
  );
}
