"use server";

import { randomUUID, createHash } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  sessionParticipants,
  sessionPieces,
  documents,
  sessionDocuments,
} from "@/db/schema";
import { requireSessionEditAccess } from "@/lib/auth-helpers";
import { requireCourseOpen } from "@/lib/course-status";
import { UPLOADS_DIR } from "@/lib/uploads";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

async function storeDocument(
  file: File,
  personId: string,
): Promise<{ error: string } | { documentId: string }> {
  if (file.type !== "application/pdf") {
    return { error: "Only PDF files are accepted." };
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return { error: "File must be a PDF under 25MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return { error: "File does not look like a valid PDF." };
  }

  const hash = createHash("sha256").update(buffer).digest("hex");

  const [existing] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.sha256Hash, hash))
    .limit(1);
  if (existing) return { documentId: existing.id };

  const id = randomUUID();
  const storagePath = `${id}.pdf`;
  await writeFile(path.join(UPLOADS_DIR, storagePath), buffer);

  const [inserted] = await db
    .insert(documents)
    .values({
      id,
      filename: file.name,
      storagePath,
      fileSize: buffer.length,
      sha256Hash: hash,
      uploadedByPersonId: personId,
    })
    .onConflictDoNothing({ target: documents.sha256Hash })
    .returning({ id: documents.id });
  if (inserted) return { documentId: inserted.id };

  // Lost the race to insert — someone else just uploaded the same file.
  const [row] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.sha256Hash, hash))
    .limit(1);
  return { documentId: row.id };
}

export async function setParticipantInstrument(
  courseId: string,
  sessionId: string,
  personId: string,
  skillTypeId: string | null,
) {
  await requireSessionEditAccess(sessionId);
  await requireCourseOpen(courseId);
  await db
    .update(sessionParticipants)
    .set({ skillTypeId })
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.personId, personId),
      ),
    );
  revalidatePath(
    `/courses/${courseId}/timetable/session/${sessionId}`,
  );
}

export async function addPiece(
  courseId: string,
  sessionId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  await requireSessionEditAccess(sessionId);
  await requireCourseOpen(courseId);
  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { error: "Title is required." };

  await db.insert(sessionPieces).values({ sessionId, title });
  revalidatePath(
    `/courses/${courseId}/timetable/session/${sessionId}`,
  );
}

export async function deletePiece(courseId: string, pieceId: string) {
  // Fetch the piece to get its sessionId for the auth check
  const [piece] = await db
    .select({ sessionId: sessionPieces.sessionId })
    .from(sessionPieces)
    .where(eq(sessionPieces.id, pieceId))
    .limit(1);
  if (!piece) return;

  await requireSessionEditAccess(piece.sessionId);
  await requireCourseOpen(courseId);
  await db.delete(sessionPieces).where(eq(sessionPieces.id, pieceId));
  revalidatePath(
    `/courses/${courseId}/timetable/session/${piece.sessionId}`,
  );
}

export async function uploadDocument(
  courseId: string,
  sessionId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const authSession = await requireSessionEditAccess(sessionId);
  await requireCourseOpen(courseId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF file." };
  }

  const result = await storeDocument(file, authSession.user.personId);
  if ("error" in result) return { error: result.error };

  await db
    .insert(sessionDocuments)
    .values({
      sessionId,
      documentId: result.documentId,
      attachedByPersonId: authSession.user.personId,
    })
    .onConflictDoNothing({
      target: [sessionDocuments.sessionId, sessionDocuments.documentId],
    });

  revalidatePath(`/courses/${courseId}/timetable/session/${sessionId}`);
}

export async function attachExistingDocument(
  courseId: string,
  sessionId: string,
  documentId: string,
) {
  const authSession = await requireSessionEditAccess(sessionId);
  await requireCourseOpen(courseId);

  await db
    .insert(sessionDocuments)
    .values({
      sessionId,
      documentId,
      attachedByPersonId: authSession.user.personId,
    })
    .onConflictDoNothing({
      target: [sessionDocuments.sessionId, sessionDocuments.documentId],
    });

  revalidatePath(`/courses/${courseId}/timetable/session/${sessionId}`);
}

export async function unattachDocument(
  courseId: string,
  sessionId: string,
  sessionDocumentId: string,
) {
  await requireSessionEditAccess(sessionId);
  await requireCourseOpen(courseId);

  await db
    .delete(sessionDocuments)
    .where(
      and(
        eq(sessionDocuments.id, sessionDocumentId),
        eq(sessionDocuments.sessionId, sessionId),
      ),
    );

  revalidatePath(`/courses/${courseId}/timetable/session/${sessionId}`);
}
