"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { people, skills, users } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";

export type ActionState = { error?: string } | undefined;
export type PasswordState = { error?: string; password?: string } | undefined;

const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isTeacher: z.boolean(),
  isOrganiser: z.boolean(),
  isAdmin: z.boolean(),
});

function parsePersonForm(formData: FormData) {
  return personSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    isTeacher: formData.get("isTeacher") === "on",
    isOrganiser: formData.get("isOrganiser") === "on",
    isAdmin: formData.get("isAdmin") === "on",
  });
}

export async function createPerson(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = parsePersonForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const [person] = await db.insert(people).values(parsed.data).returning({
    id: people.id,
  });

  revalidatePath("/people");
  redirect(`/people/${person.id}`);
}

export async function updatePerson(
  personId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = parsePersonForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.update(people).set(parsed.data).where(eq(people.id, personId));

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  return undefined;
}

export async function deletePerson(personId: string) {
  await requireOrganiserOrAdmin();
  await db.delete(people).where(eq(people.id, personId));
  revalidatePath("/people");
  redirect("/people");
}

const skillSchema = z.object({
  skillTypeId: z.string().min(1, "Choose a skill type"),
  proficiency: z.string().optional(),
  notes: z.string().optional(),
  studyOrder: z.coerce.number().int().positive().optional(),
});

export async function addSkill(
  personId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOrganiserOrAdmin();

  const parsed = skillSchema.safeParse({
    skillTypeId: formData.get("skillTypeId"),
    proficiency: formData.get("proficiency") || undefined,
    notes: formData.get("notes") || undefined,
    studyOrder: formData.get("studyOrder") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(skills).values({ personId, ...parsed.data });

  revalidatePath(`/people/${personId}`);
  return undefined;
}

export async function removeSkill(personId: string, skillId: string) {
  await requireOrganiserOrAdmin();
  await db.delete(skills).where(eq(skills.id, skillId));
  revalidatePath(`/people/${personId}`);
}

const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9._-]+$/, "Lowercase letters, numbers, . _ - only"),
});

function generatePassword() {
  return randomBytes(9).toString("base64url");
}

export async function createLogin(
  personId: string,
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  await requireOrganiserOrAdmin();

  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const password = generatePassword();
  const passwordHash = await hash(password, 12);

  try {
    await db.insert(users).values({
      personId,
      username: parsed.data.username,
      passwordHash,
    });
  } catch {
    return { error: "That username is already taken." };
  }

  revalidatePath(`/people/${personId}`);
  return { password };
}

export async function resetPassword(
  personId: string,
  userId: string,
): Promise<PasswordState> {
  await requireOrganiserOrAdmin();

  const password = generatePassword();
  const passwordHash = await hash(password, 12);

  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  revalidatePath(`/people/${personId}`);
  return { password };
}

export async function deleteLogin(personId: string, userId: string) {
  await requireOrganiserOrAdmin();
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath(`/people/${personId}`);
}
