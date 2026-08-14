"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { people, skills, courseRegistrations } from "@/db/schema";

export type ActionState = { error?: string; success?: boolean } | undefined;

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  skillTypeIds: z.array(z.string()).min(1, "Select at least one instrument"),
  notes: z.string().optional(),
});

export async function registerStudent(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    skillTypeIds: formData.getAll("skillTypeIds"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { name, email, phone, skillTypeIds, notes } = parsed.data;

  const [existingPerson] = await db
    .select()
    .from(people)
    .where(eq(people.email, email))
    .limit(1);

  let personId: string;

  if (existingPerson) {
    personId = existingPerson.id;

    const [existingRegistration] = await db
      .select()
      .from(courseRegistrations)
      .where(
        and(
          eq(courseRegistrations.courseId, courseId),
          eq(courseRegistrations.personId, personId),
        ),
      )
      .limit(1);

    if (existingRegistration) {
      return {
        error:
          "It looks like you've already submitted your details for this course.",
      };
    }

    const existingSkills = await db
      .select({ skillTypeId: skills.skillTypeId })
      .from(skills)
      .where(eq(skills.personId, personId));
    const existingSkillTypeIds = new Set(
      existingSkills.map((s) => s.skillTypeId),
    );
    const newSkillTypeIds = skillTypeIds.filter(
      (id) => !existingSkillTypeIds.has(id),
    );
    if (newSkillTypeIds.length > 0) {
      await db
        .insert(skills)
        .values(newSkillTypeIds.map((skillTypeId) => ({ personId, skillTypeId })));
    }
  } else {
    const [newPerson] = await db
      .insert(people)
      .values({ name, email, phone })
      .returning({ id: people.id });
    personId = newPerson.id;

    await db
      .insert(skills)
      .values(skillTypeIds.map((skillTypeId) => ({ personId, skillTypeId })));
  }

  await db.insert(courseRegistrations).values({
    courseId,
    personId,
    notes: notes || null,
  });

  return { success: true };
}
