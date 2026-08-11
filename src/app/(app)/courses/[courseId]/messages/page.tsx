import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/db";
import {
  courses,
  courseDays,
  timeSlots,
  rooms,
  sessions,
  sessionTeachers,
  threads,
  messages,
  people,
} from "@/db/schema";
import { auth } from "@/auth";
import { MessageThreadDialog } from "@/components/message-thread-dialog";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { courseId } = await params;
  const personId = session.user.personId;
  const isOrgOrAdmin =
    session.user.role === "admin" || session.user.role === "organiser";

  const [course] = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    notFound();
  }

  // Fetch all threads for this course, joining through the session/slot/day chain.
  // Teachers get an extra join to restrict to their own sessions.
  const baseQuery = db
    .select({
      threadId: threads.id,
      sessionId: sessions.id,
      sessionTitle: sessions.title,
      roomName: rooms.name,
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
      date: courseDays.date,
      dayLabel: courseDays.label,
    })
    .from(threads)
    .innerJoin(sessions, eq(threads.sessionId, sessions.id))
    .innerJoin(timeSlots, eq(sessions.timeSlotId, timeSlots.id))
    .innerJoin(courseDays, eq(timeSlots.courseDayId, courseDays.id))
    .leftJoin(rooms, eq(sessions.roomId, rooms.id))
    .where(eq(courseDays.courseId, courseId));

  const threadRows = isOrgOrAdmin
    ? await baseQuery
    : await db
        .select({
          threadId: threads.id,
          sessionId: sessions.id,
          sessionTitle: sessions.title,
          roomName: rooms.name,
          startTime: timeSlots.startTime,
          endTime: timeSlots.endTime,
          date: courseDays.date,
          dayLabel: courseDays.label,
        })
        .from(threads)
        .innerJoin(sessions, eq(threads.sessionId, sessions.id))
        .innerJoin(
          sessionTeachers,
          and(
            eq(sessionTeachers.sessionId, sessions.id),
            eq(sessionTeachers.personId, personId),
          ),
        )
        .innerJoin(timeSlots, eq(sessions.timeSlotId, timeSlots.id))
        .innerJoin(courseDays, eq(timeSlots.courseDayId, courseDays.id))
        .leftJoin(rooms, eq(sessions.roomId, rooms.id))
        .where(eq(courseDays.courseId, courseId));

  // Fetch all messages for those threads
  const threadIds = threadRows.map((r) => r.threadId);
  const messageRows =
    threadIds.length > 0
      ? await db
          .select({
            threadId: messages.threadId,
            body: messages.body,
            createdAt: messages.createdAt,
            authorName: people.name,
          })
          .from(messages)
          .innerJoin(people, eq(messages.authorId, people.id))
          .where(inArray(messages.threadId, threadIds))
          .orderBy(messages.createdAt)
      : [];

  // Group messages by thread
  const messagesByThread = new Map<string, typeof messageRows>();
  for (const msg of messageRows) {
    const list = messagesByThread.get(msg.threadId) ?? [];
    list.push(msg);
    messagesByThread.set(msg.threadId, list);
  }

  // Build items — only threads with messages, sorted by latest activity
  const items = threadRows
    .map((row) => ({
      ...row,
      msgs: messagesByThread.get(row.threadId) ?? [],
    }))
    .filter((item) => item.msgs.length > 0)
    .sort(
      (a, b) =>
        b.msgs[b.msgs.length - 1].createdAt.getTime() -
        a.msgs[a.msgs.length - 1].createdAt.getTime(),
    );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <Link
          href={`/courses/${courseId}/timetable`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Timetable
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sessions with recent discussion, newest first.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No messages yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const latest = item.msgs[item.msgs.length - 1];
            const preview =
              latest.body.length > 120
                ? latest.body.slice(0, 120).trimEnd() + "…"
                : latest.body;
            return (
              <li
                key={item.threadId}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{item.sessionTitle}</span>
                    {item.roomName && (
                      <span className="text-sm text-muted-foreground">
                        {item.roomName}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {item.dayLabel ?? item.date}&ensp;
                    {item.startTime.slice(0, 5)}–{item.endTime.slice(0, 5)}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">{latest.authorName}:</span>{" "}
                    <span className="text-muted-foreground">{preview}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {format(latest.createdAt, "d MMM HH:mm")}
                    {" · "}
                    {item.msgs.length}{" "}
                    {item.msgs.length === 1 ? "message" : "messages"}
                  </div>
                </div>
                <div className="shrink-0">
                  <MessageThreadDialog
                    sessionId={item.sessionId}
                    sessionTitle={item.sessionTitle}
                    initialCount={item.msgs.length}
                    currentPersonId={personId}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
