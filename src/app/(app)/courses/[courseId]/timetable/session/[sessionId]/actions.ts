"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  sessionParticipants,
  sessionPieces,
  sessionTeachers,
} from "@/db/schema";
import { requireSession, requireOrganiserOrAdmin } from "@/lib/auth-helpers";
import { requireCourseOpen } from "@/lib/course-status";

async function assertCanEdit(sessionId: string) {
  const authSession = await requireSession();
  const role = authSession.user.role;
  if (role === "admin" || role === "organiser") return authSession;

  // Check if the current user is an assigned teacher on this session
  const personId = authSession.user.personId;
  const [row] = await db
    .select({ sessionId: sessionTeachers.sessionId })
    .from(sessionTeachers)
    .where(
      and(
        eq(sessionTeachers.sessionId, sessionId),
        eq(sessionTeachers.personId, personId),
      ),
    )
    .limit(1);

  if (!row) throw new Error("Forbidden");
  return authSession;
}

export async function setParticipantInstrument(
  courseId: string,
  sessionId: string,
  personId: string,
  skillTypeId: string | null,
) {
  await assertCanEdit(sessionId);
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
  await assertCanEdit(sessionId);
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

  await assertCanEdit(piece.sessionId);
  await requireCourseOpen(courseId);
  await db.delete(sessionPieces).where(eq(sessionPieces.id, pieceId));
  revalidatePath(
    `/courses/${courseId}/timetable/session/${piece.sessionId}`,
  );
}
