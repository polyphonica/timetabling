import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses, people } from "@/db/schema";
import { auth } from "@/auth";
import { getCourseTimetable } from "@/lib/timetable-data";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { MessageThreadDialog } from "@/components/message-thread-dialog";

export default async function TeacherTimetablePage({
  params,
}: {
  params: Promise<{ courseId: string; personId: string }>;
}) {
  const { courseId, personId } = await params;
  const authSession = await auth();
  const currentPersonId = authSession!.user.personId;

  const [course] = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) {
    notFound();
  }

  const [teacher] = await db
    .select({ id: people.id, name: people.name })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);
  if (!teacher) {
    notFound();
  }

  const timetable = await getCourseTimetable(courseId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/courses/${courseId}/timetable`}
            className="text-sm text-muted-foreground hover:text-foreground print:hidden"
          >
            ← Master timetable
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{teacher.name}</h1>
          <p className="text-sm text-muted-foreground">{course.name}</p>
          {timetable.teachers.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-3 text-sm print:hidden">
              <span className="text-muted-foreground">Switch to:</span>
              {timetable.teachers
                .filter((t) => t.id !== personId)
                .map((t) => (
                  <Link
                    key={t.id}
                    href={`/courses/${courseId}/timetable/teacher/${t.id}`}
                    className="underline"
                  >
                    {t.name}
                  </Link>
                ))}
            </div>
          )}
        </div>
        <PrintButton />
      </div>

      <div className="flex flex-col gap-6">
        {timetable.days
          .map((day) => ({
            day,
            relevantSlots: day.slots.filter(
              (slot) =>
                slot.kind === "break" ||
                slot.sessions.some((s) =>
                  s.teachers.some((t) => t.id === personId),
                ),
            ),
          }))
          .filter(({ relevantSlots }) => relevantSlots.length > 0)
          .map(({ day, relevantSlots }, index) => (
            <div
              key={day.id}
              className={`print:break-inside-avoid${index > 0 ? " print:break-before-page" : ""}`}
            >
              <h2 className="mb-2 font-medium">
                {day.date}
                {day.label && <span className="ml-2">{day.label}</span>}
              </h2>
              <ul className="flex flex-col gap-2">
                {relevantSlots.map((slot) => {
                  if (slot.kind === "break") {
                    return (
                      <li
                        key={slot.id}
                        className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                      >
                        {slot.startTime.slice(0, 5)}–
                        {slot.endTime.slice(0, 5)} {slot.label ?? "Break"}
                      </li>
                    );
                  }
                  const mySessions = slot.sessions.filter((s) =>
                    s.teachers.some((t) => t.id === personId),
                  );
                  return mySessions.map((session) => (
                    <li key={session.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">
                            {slot.startTime.slice(0, 5)}–
                            {slot.endTime.slice(0, 5)}
                          </span>
                          <Link
                            href={`/courses/${courseId}/timetable/session/${session.id}`}
                            className="font-medium underline hover:no-underline print:no-underline"
                          >
                            {session.title}
                          </Link>
                          {session.roomName && (
                            <Badge variant="secondary">{session.roomName}</Badge>
                          )}
                        </div>
                        <MessageThreadDialog
                          sessionId={session.id}
                          sessionTitle={session.title}
                          initialCount={session.messageCount}
                          currentPersonId={currentPersonId}
                        />
                      </div>
                      {session.teachers.length > 1 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          With{" "}
                          {session.teachers
                            .filter((t) => t.id !== personId)
                            .map((t) => t.name)
                            .join(", ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {session.participants.length > 0
                          ? session.participants.map((p) => p.name).join(", ")
                          : "No participants assigned yet"}
                      </p>
                    </li>
                  ));
                })}
              </ul>
            </div>
          ))}
        {timetable.days.every(
          (day) =>
            !day.slots.some((slot) =>
              slot.sessions.some((s) =>
                s.teachers.some((t) => t.id === personId),
              ),
            ),
        ) && (
          <p className="text-sm text-muted-foreground">
            No sessions scheduled for {teacher.name} yet.
          </p>
        )}
      </div>
    </div>
  );
}
