import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { courses, courseRegistrations, people } from "@/db/schema";

function csvField(value: string | null): string {
  const s = value ?? "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "organiser") {
    return new Response("Forbidden", { status: 403 });
  }

  const { courseId } = await params;

  const [course] = await db
    .select({ name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) return new Response("Not found", { status: 404 });

  const rows = await db
    .select({
      name: people.name,
      email: people.email,
      phone: people.phone,
    })
    .from(courseRegistrations)
    .innerJoin(people, eq(courseRegistrations.personId, people.id))
    .where(
      and(
        eq(courseRegistrations.courseId, courseId),
        eq(courseRegistrations.status, "accepted"),
      ),
    )
    .orderBy(people.name);

  const lines = [
    "Name,Email,Phone",
    ...rows.map((r) =>
      [csvField(r.name), csvField(r.email), csvField(r.phone)].join(","),
    ),
  ];
  const csv = lines.join("\r\n") + "\r\n";

  const safeCourseName = course.name.replace(/[^a-z0-9]+/gi, "-");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeCourseName}-accepted-students.csv"`,
    },
  });
}
