"use server";

import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession } from "@/lib/auth-helpers";

export type ChangePasswordState =
  | { error?: string; success?: boolean }
  | undefined;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  });

export async function changeOwnPassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await requireSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.personId, session.user.personId))
    .limit(1);

  if (!user) {
    return { error: "No login found for your account." };
  }

  const currentMatches = await compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!currentMatches) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await hash(parsed.data.newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return { success: true };
}
