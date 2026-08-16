import { readFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { UPLOADS_DIR } from "@/lib/uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!doc) return new Response(null, { status: 404 });

  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(path.join(UPLOADS_DIR, doc.storagePath));
  } catch {
    return new Response(null, { status: 404 });
  }

  const safeName = doc.filename.replace(/["\\\r\n]/g, "_");
  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Content-Length": String(doc.fileSize),
    },
  });
}
