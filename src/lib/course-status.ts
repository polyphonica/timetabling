import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";

type CourseDates = { startDate: string; endDate: string };
type CourseLifecycle = CourseDates & { reopened: boolean };

function startOfDay(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function endOfDay(date: string): Date {
  return new Date(`${date}T23:59:59.999`);
}

export function isCourseInProgress(course: CourseDates): boolean {
  const now = new Date();
  return startOfDay(course.startDate) <= now && now <= endOfDay(course.endDate);
}

export function isCourseUpcoming(course: CourseDates): boolean {
  return startOfDay(course.startDate) > new Date();
}

// Past its end date and not manually reopened by an organiser/admin.
export function isCourseClosed(course: CourseLifecycle): boolean {
  if (course.reopened) return false;
  return new Date() > endOfDay(course.endDate);
}

// The course new registrations and admin actions default to when no
// specific course is chosen: whichever course is in progress right now,
// or failing that, the soonest upcoming one.
export async function getLiveCourse() {
  const allCourses = await db
    .select({
      id: courses.id,
      name: courses.name,
      startDate: courses.startDate,
      endDate: courses.endDate,
    })
    .from(courses);

  const inProgress = allCourses
    .filter(isCourseInProgress)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
  if (inProgress.length > 0) return inProgress[0];

  const upcoming = allCourses
    .filter(isCourseUpcoming)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? null;
}

// Throws if the course has ended and hasn't been manually reopened —
// call this at the top of any server action that mutates course data.
export async function requireCourseOpen(courseId: string) {
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
    throw new Error("Course not found");
  }
  if (isCourseClosed(course)) {
    throw new Error("This course has ended and is now read-only.");
  }
}
