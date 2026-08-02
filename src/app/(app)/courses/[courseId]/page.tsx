import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditCourseForm } from "./edit-course-form";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireOrganiserOrAdminPage();
  const { courseId } = await params;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <div>
        <Link
          href="/courses"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All courses
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{course.name}</h1>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/courses/${course.id}/days`}
          className="text-sm underline"
        >
          Days &amp; time slots
        </Link>
        <Link
          href={`/courses/${course.id}/rooms`}
          className="text-sm underline"
        >
          Rooms
        </Link>
        <Link
          href={`/courses/${course.id}/timetable`}
          className="text-sm underline"
        >
          Timetable
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditCourseForm key={JSON.stringify(course)} course={course} />
        </CardContent>
      </Card>
    </div>
  );
}
