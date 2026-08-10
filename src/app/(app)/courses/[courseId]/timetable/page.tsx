import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { auth } from "@/auth";
import { getCourseTimetable } from "@/lib/timetable-data";
import { PrintButton } from "@/components/print-button";
import { TimetableGrid } from "./timetable-grid";

export default async function TimetablePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  const canEdit =
    session?.user?.role === "admin" || session?.user?.role === "organiser";
  const { courseId } = await params;

  const [course] = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    notFound();
  }

  const timetable = await getCourseTimetable(courseId);
  const currentPersonId = session!.user.personId;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          {canEdit && (
            <Link
              href={`/courses/${courseId}`}
              className="text-sm text-muted-foreground hover:text-foreground print:hidden"
            >
              ← {course.name}
            </Link>
          )}
          <h1 className="mt-2 text-xl font-semibold">
            {course.name} timetable
          </h1>
          {timetable.teachers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3 text-sm print:hidden">
              <span className="text-muted-foreground">Per-teacher view:</span>
              {timetable.teachers.map((teacher) => (
                <Link
                  key={teacher.id}
                  href={`/courses/${courseId}/timetable/teacher/${teacher.id}`}
                  className="underline"
                >
                  {teacher.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Link
            href={`/courses/${courseId}/timetable/summary`}
            className="text-sm underline"
          >
            Summary / print
          </Link>
          <PrintButton />
        </div>
      </div>

      <TimetableGrid
        courseId={courseId}
        data={timetable}
        canEdit={canEdit}
        currentPersonId={currentPersonId}
      />
    </div>
  );
}
