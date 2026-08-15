import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLiveCourse, isCourseClosed } from "@/lib/course-status";
import { CreateCourseDialog } from "./create-course-dialog";

export default async function CoursesPage() {
  await requireOrganiserOrAdminPage();

  const [allCourses, liveCourse] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.startDate)),
    getLiveCourse(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Courses</h1>
        <CreateCourseDialog />
      </div>
      <div className="flex flex-col gap-3">
        {allCourses.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {course.name}
                  {course.id === liveCourse?.id ? (
                    <Badge>Current</Badge>
                  ) : isCourseClosed(course) ? (
                    <Badge variant="destructive">Closed</Badge>
                  ) : (
                    <Badge variant="secondary">Upcoming</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {course.startDate} – {course.endDate}
                {course.venue ? ` · ${course.venue}` : ""}
              </CardContent>
            </Card>
          </Link>
        ))}
        {allCourses.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No courses yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
