"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { skillTypes } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";

export type ActionState = { error?: string } | undefined;

const skillTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  group: z.string().optional(),
});

export async function createSkillType(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = skillTypeSchema.safeParse({
    name: formData.get("name"),
    group: formData.get("group") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.insert(skillTypes).values(parsed.data);
  } catch {
    return { error: "That skill type already exists." };
  }

  revalidatePath("/skill-types");
  return undefined;
}

export async function updateSkillType(
  skillTypeId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = skillTypeSchema.safeParse({
    name: formData.get("name"),
    group: formData.get("group") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db
      .update(skillTypes)
      .set(parsed.data)
      .where(eq(skillTypes.id, skillTypeId));
  } catch {
    return { error: "That skill type name is already in use." };
  }

  revalidatePath("/skill-types");
  return undefined;
}

export async function deleteSkillType(skillTypeId: string) {
  await requireOrganiserOrAdmin();
  try {
    await db.delete(skillTypes).where(eq(skillTypes.id, skillTypeId));
  } catch {
    throw new Error(
      "Can't remove a skill type that's still assigned to someone.",
    );
  }
  revalidatePath("/skill-types");
}
