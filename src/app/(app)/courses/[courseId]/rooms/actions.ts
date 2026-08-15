"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";
import { requireCourseOpen } from "@/lib/course-status";

export type ActionState = { error?: string } | undefined;

const roomSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function createRoom(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);

  const parsed = roomSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(rooms).values({ courseId, name: parsed.data.name });

  revalidatePath(`/courses/${courseId}/rooms`);
  return undefined;
}

export async function updateRoom(
  courseId: string,
  roomId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);

  const parsed = roomSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.update(rooms).set({ name: parsed.data.name }).where(eq(rooms.id, roomId));

  revalidatePath(`/courses/${courseId}/rooms`);
  return undefined;
}

export async function deleteRoom(courseId: string, roomId: string) {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);
  await db.delete(rooms).where(eq(rooms.id, roomId));
  revalidatePath(`/courses/${courseId}/rooms`);
}
