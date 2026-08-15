"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";
import { requireCourseOpen } from "@/lib/course-status";

export type ActionState = { error?: string } | undefined;

const courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  venue: z.string().optional(),
});

function parseCourseForm(formData: FormData) {
  return courseSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    venue: formData.get("venue") || undefined,
  });
}

export async function createCourse(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const [course] = await db
    .insert(courses)
    .values(parsed.data)
    .returning({ id: courses.id });

  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();
  await requireCourseOpen(courseId);

  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.update(courses).set(parsed.data).where(eq(courses.id, courseId));

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  return undefined;
}

function revalidateCoursePaths(courseId: string) {
  for (const path of [
    "",
    "/days",
    "/rooms",
    "/timetable",
    "/tasks",
    "/registrations",
  ]) {
    revalidatePath(`/courses/${courseId}${path}`);
  }
  revalidatePath("/courses");
}

export async function reopenCourse(courseId: string) {
  await requireOrganiserOrAdmin();
  await db
    .update(courses)
    .set({ reopened: true })
    .where(eq(courses.id, courseId));
  revalidateCoursePaths(courseId);
}

export async function closeCourseNow(courseId: string) {
  await requireOrganiserOrAdmin();
  await db
    .update(courses)
    .set({ reopened: false })
    .where(eq(courses.id, courseId));
  revalidateCoursePaths(courseId);
}
