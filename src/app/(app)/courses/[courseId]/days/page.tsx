import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  courses,
  courseDays,
  timeSlots,
  rooms,
  people,
  sessions,
  sessionTeachers,
} from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { AddDayForm } from "./add-day-form";
import { AddSlotForm } from "./add-slot-form";
import { SessionFormDialog } from "./session-form-dialog";
import { deleteDay, deleteTimeSlot } from "./actions";
import { createSession, updateSession, deleteSession } from "./session-actions";

export default async function DaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  await requireOrganiserOrAdminPage();
  const { courseId } = await params;
  const { day: selectedDayId } = await searchParams;

  const [course] = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    notFound();
  }

  const [days, courseRooms, teachers] = await Promise.all([
    db
      .select()
      .from(courseDays)
      .where(eq(courseDays.courseId, courseId))
      .orderBy(courseDays.date),
    db
      .select({ id: rooms.id, name: rooms.name })
      .from(rooms)
      .where(eq(rooms.courseId, courseId))
      .orderBy(rooms.name),
    db
      .select({ id: people.id, name: people.name })
      .from(people)
      .where(eq(people.isTeacher, true))
      .orderBy(people.name),
  ]);

  const visibleDays = selectedDayId
    ? days.filter((day) => day.id === selectedDayId)
    : days;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <div>
        <Link
          href={`/courses/${courseId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {course.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Days &amp; time slots</h1>
      </div>

      <AddDayForm courseId={courseId} />

      {selectedDayId && (
        <Link
          href={`/courses/${courseId}/days`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Show all days
        </Link>
      )}

      <div className="flex flex-col gap-4">
        {visibleDays.map((day) => (
          <DayCard
            key={day.id}
            courseId={courseId}
            day={day}
            courseRooms={courseRooms}
            teachers={teachers}
            showFilterLink={!selectedDayId}
          />
        ))}
        {days.length === 0 && (
          <p className="text-sm text-muted-foreground">No days yet.</p>
        )}
        {days.length > 0 && visibleDays.length === 0 && (
          <p className="text-sm text-muted-foreground">
            That day no longer exists.
          </p>
        )}
      </div>
    </div>
  );
}

async function DayCard({
  courseId,
  day,
  courseRooms,
  teachers,
  showFilterLink,
}: {
  courseId: string;
  day: typeof courseDays.$inferSelect;
  courseRooms: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  showFilterLink: boolean;
}) {
  const slots = await db
    .select()
    .from(timeSlots)
    .where(eq(timeSlots.courseDayId, day.id))
    .orderBy(timeSlots.startTime);

  return (
    <div className="overflow-hidden rounded-lg border-2">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-3">
        <div>
          <span className="font-semibold">{day.date}</span>
          {day.label && (
            <span className="ml-2 font-semibold">{day.label}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showFilterLink && (
            <Link
              href={`/courses/${courseId}/days?day=${day.id}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Show this day only
            </Link>
          )}
          <DeleteButton
            action={deleteDay.bind(null, courseId, day.id)}
            label="Remove day"
            confirmMessage="Remove this day? This also deletes its time slots and any sessions scheduled in them."
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={
              slot.kind === "session"
                ? "rounded-md border border-primary/20 bg-primary/10 px-3 py-2"
                : "rounded-md bg-muted/50 px-3 py-2"
            }
          >
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                <Badge variant={slot.kind === "break" ? "secondary" : "default"}>
                  {slot.kind}
                </Badge>
                {slot.label && (
                  <span className="text-muted-foreground">{slot.label}</span>
                )}
              </span>
              <DeleteButton
                action={deleteTimeSlot.bind(null, courseId, slot.id)}
                confirmMessage={
                  slot.kind === "session"
                    ? "Remove this time slot? Any session scheduled in it will also be deleted."
                    : undefined
                }
              />
            </div>
            {slot.kind === "session" && (
              <SessionsForSlot
                courseId={courseId}
                timeSlotId={slot.id}
                courseRooms={courseRooms}
                teachers={teachers}
              />
            )}
          </div>
        ))}
        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground">No time slots yet.</p>
        )}

        <AddSlotForm courseId={courseId} courseDayId={day.id} />
      </div>
    </div>
  );
}

async function SessionsForSlot({
  courseId,
  timeSlotId,
  courseRooms,
  teachers,
}: {
  courseId: string;
  timeSlotId: string;
  courseRooms: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}) {
  const slotSessions = await db
    .select({ id: sessions.id, title: sessions.title, roomId: sessions.roomId })
    .from(sessions)
    .where(eq(sessions.timeSlotId, timeSlotId));

  const teacherRows =
    slotSessions.length > 0
      ? await db
          .select({
            sessionId: sessionTeachers.sessionId,
            personId: sessionTeachers.personId,
            name: people.name,
          })
          .from(sessionTeachers)
          .innerJoin(people, eq(sessionTeachers.personId, people.id))
          .where(
            inArray(
              sessionTeachers.sessionId,
              slotSessions.map((s) => s.id),
            ),
          )
      : [];

  return (
    <div className="mt-2 flex flex-col gap-2 border-t pt-2">
      {slotSessions.map((session) => {
        const sessionTeacherRows = teacherRows.filter(
          (t) => t.sessionId === session.id,
        );
        const roomName = courseRooms.find((r) => r.id === session.roomId)?.name;
        return (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <span>
              <span className="font-medium">{session.title}</span>
              {roomName && (
                <span className="ml-2 text-muted-foreground">{roomName}</span>
              )}
              {sessionTeacherRows.length > 0 && (
                <span className="ml-2 text-muted-foreground">
                  {sessionTeacherRows.map((t) => t.name).join(", ")}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <SessionFormDialog
                key={JSON.stringify({
                  title: session.title,
                  roomId: session.roomId,
                  teacherIds: sessionTeacherRows.map((t) => t.personId),
                })}
                action={updateSession.bind(
                  null,
                  courseId,
                  session.id,
                  timeSlotId,
                )}
                dialogTitle="Edit session"
                rooms={courseRooms}
                teachers={teachers}
                initial={{
                  title: session.title,
                  roomId: session.roomId,
                  teacherIds: sessionTeacherRows.map((t) => t.personId),
                }}
                trigger={
                  <Button type="button" variant="ghost" size="sm">
                    Edit
                  </Button>
                }
              />
              <DeleteButton
                action={deleteSession.bind(null, courseId, session.id)}
              />
            </div>
          </div>
        );
      })}
      <SessionFormDialog
        action={createSession.bind(null, courseId, timeSlotId)}
        dialogTitle="New session"
        rooms={courseRooms}
        teachers={teachers}
        trigger={
          <Button type="button" variant="outline" size="sm">
            Add session
          </Button>
        }
      />
    </div>
  );
}
