import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { getCourseTimetable } from "@/lib/timetable-data";
import { PrintButton } from "@/components/print-button";

export default async function TimetableSummaryPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
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

  // Collect unique time ranges across all days, preserving kind from first occurrence
  const slotKeyMap = new Map<
    string,
    { startTime: string; endTime: string; kind: "session" | "break" }
  >();
  for (const day of timetable.days) {
    for (const slot of day.slots) {
      const key = `${slot.startTime}|${slot.endTime}`;
      if (!slotKeyMap.has(key)) {
        slotKeyMap.set(key, {
          startTime: slot.startTime,
          endTime: slot.endTime,
          kind: slot.kind,
        });
      }
    }
  }
  const uniqueSlots = Array.from(slotKeyMap.values()).sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  return (
    <>
      <style>{`@page { size: landscape; margin: 1cm; }`}</style>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div>
            <Link
              href={`/courses/${courseId}/timetable`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Timetable
            </Link>
            <h1 className="mt-1 text-xl font-semibold">
              {course.name} – Summary
            </h1>
          </div>
          <PrintButton />
        </div>
        <h1 className="mb-3 hidden text-base font-semibold print:block">
          {course.name}
        </h1>

        {timetable.days.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No days set up for this course yet.
          </p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-20 border border-gray-400 bg-gray-100 px-2 py-1 text-left font-semibold">
                  Time
                </th>
                {timetable.days.map((day) => (
                  <th
                    key={day.id}
                    className="border border-gray-400 bg-gray-100 px-2 py-1 text-left font-semibold"
                  >
                    {day.label ?? day.date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueSlots.map((timeSlot) => {
                const key = `${timeSlot.startTime}|${timeSlot.endTime}`;
                const isBreak = timeSlot.kind === "break";
                return (
                  <tr key={key} className={isBreak ? "bg-gray-50" : ""}>
                    <td className="border border-gray-300 px-2 py-1 whitespace-nowrap text-gray-500">
                      {timeSlot.startTime.slice(0, 5)}–
                      {timeSlot.endTime.slice(0, 5)}
                    </td>
                    {timetable.days.map((day) => {
                      const slot = day.slots.find(
                        (s) =>
                          s.startTime === timeSlot.startTime &&
                          s.endTime === timeSlot.endTime,
                      );
                      if (!slot) {
                        return (
                          <td
                            key={day.id}
                            className="border border-gray-300 px-2 py-1"
                          />
                        );
                      }
                      if (slot.kind === "break") {
                        return (
                          <td
                            key={day.id}
                            className="border border-gray-300 px-2 py-1 text-center text-gray-400 italic"
                          >
                            {slot.label ?? "Break"}
                          </td>
                        );
                      }
                      return (
                        <td
                          key={day.id}
                          className="border border-gray-300 px-2 py-1 align-top"
                        >
                          <div className="flex flex-col gap-1">
                            {slot.sessions.map((session) => (
                              <div key={session.id}>
                                <div className="font-medium leading-tight">
                                  {session.title}
                                </div>
                                {session.teachers.length > 0 && (
                                  <div className="leading-tight text-gray-500">
                                    {session.teachers
                                      .map((t) => t.name)
                                      .join(", ")}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
