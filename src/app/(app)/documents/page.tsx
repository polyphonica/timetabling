import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  documents,
  sessionPieces,
  sessions,
  timeSlots,
  courseDays,
  courses,
  people,
} from "@/db/schema";
import { DocumentsTable } from "./documents-table";
import { deleteDocumentPermanently } from "./actions";

export default async function DocumentsPage() {
  const authSession = await auth();
  const canManage =
    authSession?.user?.role === "admin" || authSession?.user?.role === "organiser";

  const rows = await db
    .select({
      documentId: documents.id,
      filename: documents.filename,
      fileSize: documents.fileSize,
      uploadedByName: people.name,
      createdAt: documents.createdAt,
      pieceId: sessionPieces.id,
      pieceTitle: sessionPieces.title,
      sessionId: sessions.id,
      sessionTitle: sessions.title,
      courseName: courses.name,
      dayDate: courseDays.date,
      startTime: timeSlots.startTime,
    })
    .from(documents)
    .leftJoin(people, eq(documents.uploadedByPersonId, people.id))
    .leftJoin(sessionPieces, eq(sessionPieces.documentId, documents.id))
    .leftJoin(sessions, eq(sessionPieces.sessionId, sessions.id))
    .leftJoin(timeSlots, eq(sessions.timeSlotId, timeSlots.id))
    .leftJoin(courseDays, eq(timeSlots.courseDayId, courseDays.id))
    .leftJoin(courses, eq(courseDays.courseId, courses.id))
    .orderBy(desc(documents.createdAt));

  // Collapse into one row per document, with its list of attachments.
  const byDocument = new Map<
    string,
    {
      documentId: string;
      filename: string;
      fileSize: number;
      uploadedByName: string | null;
      createdAt: Date;
      attachments: {
        pieceId: string;
        pieceTitle: string;
        sessionId: string;
        sessionTitle: string;
        courseName: string;
        dayDate: string;
        startTime: string;
      }[];
    }
  >();
  for (const row of rows) {
    let entry = byDocument.get(row.documentId);
    if (!entry) {
      entry = {
        documentId: row.documentId,
        filename: row.filename,
        fileSize: row.fileSize,
        uploadedByName: row.uploadedByName,
        createdAt: row.createdAt,
        attachments: [],
      };
      byDocument.set(row.documentId, entry);
    }
    if (row.pieceId && row.sessionId && row.courseName) {
      entry.attachments.push({
        pieceId: row.pieceId,
        pieceTitle: row.pieceTitle!,
        sessionId: row.sessionId,
        sessionTitle: row.sessionTitle!,
        courseName: row.courseName,
        dayDate: row.dayDate!,
        startTime: row.startTime!,
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Sheet music and other files uploaded against timetable session
          pieces, searchable across every course.
        </p>
      </div>
      <DocumentsTable
        documents={[...byDocument.values()]}
        canManage={canManage}
        deleteAction={deleteDocumentPermanently}
      />
    </div>
  );
}
