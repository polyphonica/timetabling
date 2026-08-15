import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/db";
import { courses, skillTypes } from "@/db/schema";
import { isCourseClosed } from "@/lib/course-status";
import { RegistrationForm } from "./registration-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    notFound();
  }

  const types = await db
    .select()
    .from(skillTypes)
    .orderBy(skillTypes.group, skillTypes.sortOrder, skillTypes.name);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">{course.name}</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(course.startDate), "d MMMM yyyy")} –{" "}
          {format(new Date(course.endDate), "d MMMM yyyy")}
        </p>
        {isCourseClosed(course) ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Registration for this course has closed.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Please enter your details below to register your interest in this
            course.
          </p>
        )}
      </div>

      {!isCourseClosed(course) && (
        <RegistrationForm courseId={courseId} skillTypes={types} />
      )}
    </div>
  );
}
