"use server";

import { unlink } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { requireOrganiserOrAdmin } from "@/lib/auth-helpers";
import { UPLOADS_DIR } from "@/lib/uploads";

export async function deleteDocumentPermanently(documentId: string) {
  await requireOrganiserOrAdmin();

  const [doc] = await db
    .select({ storagePath: documents.storagePath })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!doc) return;

  await db.delete(documents).where(eq(documents.id, documentId));

  try {
    await unlink(path.join(UPLOADS_DIR, doc.storagePath));
  } catch {
    // File already missing on disk — the DB row is gone either way.
  }

  revalidatePath("/documents");
}
