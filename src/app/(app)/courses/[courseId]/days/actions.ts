"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseDays, timeSlots } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";

export type ActionState = { error?: string } | undefined;

const daySchema = z.object({
  date: z.string().min(1, "Date is required"),
  label: z.string().optional(),
});

export async function createDay(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = daySchema.safeParse({
    date: formData.get("date"),
    label: formData.get("label") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(courseDays).values({ courseId, ...parsed.data });

  revalidatePath(`/courses/${courseId}/days`);
  return undefined;
}

export async function deleteDay(courseId: string, dayId: string) {
  await requireOrganiserOrAdmin();
  await db.delete(courseDays).where(eq(courseDays.id, dayId));
  revalidatePath(`/courses/${courseId}/days`);
}

const slotSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  kind: z.enum(["session", "break"]),
  label: z.string().optional(),
});

export async function createTimeSlot(
  courseId: string,
  courseDayId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = slotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    kind: formData.get("kind"),
    label: formData.get("label") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.endTime <= parsed.data.startTime) {
    return { error: "End time must be after start time" };
  }

  await db.insert(timeSlots).values({ courseDayId, ...parsed.data });

  revalidatePath(`/courses/${courseId}/days`);
  return undefined;
}

export async function deleteTimeSlot(courseId: string, slotId: string) {
  await requireOrganiserOrAdmin();
  await db.delete(timeSlots).where(eq(timeSlots.id, slotId));
  revalidatePath(`/courses/${courseId}/days`);
}
