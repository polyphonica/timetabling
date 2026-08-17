"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interestTypes } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";

export type ActionState = { error?: string } | undefined;

const interestTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  group: z.string().optional(),
});

export async function createInterestType(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = interestTypeSchema.safeParse({
    name: formData.get("name"),
    group: formData.get("group") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.insert(interestTypes).values(parsed.data);
  } catch {
    return { error: "That interest already exists." };
  }

  revalidatePath("/interest-types");
  return undefined;
}

export async function updateInterestType(
  interestTypeId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = interestTypeSchema.safeParse({
    name: formData.get("name"),
    group: formData.get("group") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db
      .update(interestTypes)
      .set(parsed.data)
      .where(eq(interestTypes.id, interestTypeId));
  } catch {
    return { error: "That interest name is already in use." };
  }

  revalidatePath("/interest-types");
  return undefined;
}

export async function deleteInterestType(
  interestTypeId: string,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();
  try {
    await db.delete(interestTypes).where(eq(interestTypes.id, interestTypeId));
  } catch {
    return {
      error: "Can't remove an interest that's still selected on a registration.",
    };
  }
  revalidatePath("/interest-types");
  return undefined;
}
