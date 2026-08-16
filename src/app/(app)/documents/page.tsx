import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  documents,
  sessionDocuments,
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
      sessionDocumentId: sessionDocuments.id,
      sessionId: sessions.id,
      sessionTitle: sessions.title,
      courseName: courses.name,
      dayDate: courseDays.date,
      startTime: timeSlots.startTime,
    })
    .from(documents)
    .leftJoin(people, eq(documents.uploadedByPersonId, people.id))
    .leftJoin(sessionDocuments, eq(sessionDocuments.documentId, documents.id))
    .leftJoin(sessions, eq(sessionDocuments.sessionId, sessions.id))
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
        sessionDocumentId: string;
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
    if (row.sessionDocumentId && row.sessionId && row.courseName) {
      entry.attachments.push({
        sessionDocumentId: row.sessionDocumentId,
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
          Sheet music and other files uploaded against timetable sessions,
          searchable across every course.
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
