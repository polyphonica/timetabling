"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requireSession } from "@/lib/auth-helpers";

export type ActionState = { error?: string } | undefined;

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function createTask(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const personId = session.user.personId;

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(tasks).values({
    courseId,
    createdBy: personId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    dueDate: parsed.data.dueDate ?? null,
  });

  revalidatePath(`/courses/${courseId}/tasks`);
  return undefined;
}

export async function completeTask(courseId: string, taskId: string) {
  const session = await requireSession();
  const personId = session.user.personId;

  await db
    .update(tasks)
    .set({ completedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, personId)));

  revalidatePath(`/courses/${courseId}/tasks`);
}

export async function undoTask(courseId: string, taskId: string) {
  const session = await requireSession();
  const personId = session.user.personId;

  await db
    .update(tasks)
    .set({ completedAt: null })
    .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, personId)));

  revalidatePath(`/courses/${courseId}/tasks`);
}

export async function deleteTask(courseId: string, taskId: string) {
  const session = await requireSession();
  const personId = session.user.personId;

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.createdBy, personId)));

  revalidatePath(`/courses/${courseId}/tasks`);
}
