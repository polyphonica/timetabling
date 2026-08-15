import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { auth } from "@/auth";
import { isCourseClosed } from "@/lib/course-status";
import { CourseClosedBanner } from "./course-closed-banner";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course] = await db
    .select({
      startDate: courses.startDate,
      endDate: courses.endDate,
      reopened: courses.reopened,
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    return <>{children}</>;
  }

  const session = await auth();
  const canManage =
    session?.user?.role === "admin" || session?.user?.role === "organiser";

  return (
    <div className="flex flex-1 flex-col">
      {isCourseClosed(course) && (
        <div className="px-8 pt-6">
          <CourseClosedBanner courseId={courseId} canReopen={canManage} />
        </div>
      )}
      {children}
    </div>
  );
}
