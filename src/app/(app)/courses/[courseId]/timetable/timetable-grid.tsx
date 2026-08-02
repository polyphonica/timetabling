"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CourseTimetable, SessionInfo } from "@/lib/timetable-data";
import { StudentChip } from "./student-chip";
import { SessionCell } from "./session-cell";
import { addParticipant } from "./actions";

type Mode = "room" | "teacher";

export function TimetableGrid({
  courseId,
  data,
  canEdit,
  currentPersonId,
}: {
  courseId: string;
  data: CourseTimetable;
  canEdit: boolean;
  currentPersonId: string;
}) {
  const [mode, setMode] = useState<Mode>("room");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeDrag, setActiveDrag] = useState<{
    personId: string;
    name: string;
  } | null>(null);
  const router = useRouter();

  function toggleSelected(personId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === data.students.length
        ? new Set()
        : new Set(data.students.map((s) => s.id)),
    );
  }

  const hasSessionsWithoutRoom = data.days.some((day) =>
    day.slots.some((slot) =>
      slot.sessions.some((s) => s.roomId === null),
    ),
  );

  const columns = useMemo(() => {
    if (mode === "room") {
      return hasSessionsWithoutRoom
        ? [...data.rooms, { id: "none", name: "No room" }]
        : data.rooms;
    }
    return data.teachers;
  }, [mode, data.rooms, data.teachers, hasSessionsWithoutRoom]);

  function sessionsForColumn(
    sessions: SessionInfo[],
    columnId: string,
  ): SessionInfo[] {
    if (mode === "room") {
      return sessions.filter((s) => (s.roomId ?? "none") === columnId);
    }
    return sessions.filter((s) => s.teachers.some((t) => t.id === columnId));
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    if (!activeId.startsWith("student:")) return;
    const data = event.active.data.current as
      | { personId: string; name: string }
      | undefined;
    if (data) {
      setActiveDrag({ personId: data.personId, name: data.name });
    }
  }

  function handleDragCancel() {
    setActiveDrag(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("student:") || !overId.startsWith("session:")) {
      return;
    }
    const personId = activeId.slice("student:".length);
    const sessionId = overId.slice("session:".length);

    const personIds =
      selectedIds.has(personId) && selectedIds.size > 1
        ? [...selectedIds]
        : [personId];

    Promise.all(
      personIds.map((id) => addParticipant(courseId, sessionId, id)),
    ).then((results) => {
      const errors = results.filter(
        (r): r is { error: string } => !!r?.error,
      );
      if (errors.length > 0) {
        toast.error(
          errors.length === results.length
            ? errors[0].error
            : `${errors.length} of ${results.length} couldn't be added: ${errors[0].error}`,
        );
      }
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  const grid = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 print:hidden">
        <Button
          type="button"
          variant={mode === "room" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("room")}
        >
          By room
        </Button>
        <Button
          type="button"
          variant={mode === "teacher" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("teacher")}
        >
          By teacher
        </Button>
      </div>

      {data.days.map((day) => (
        <div key={day.id} className="overflow-x-auto print:break-inside-avoid print:break-before-page">
          <h2 className="mb-2 font-medium">
            {day.date}
            {day.label && (
              <span className="ml-2 text-sm text-muted-foreground">
                {day.label}
              </span>
            )}
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-24 border-b p-2 text-left font-medium">
                  Time
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="min-w-40 border-b p-2 text-left font-medium"
                  >
                    {col.name}
                  </th>
                ))}
                {columns.length === 0 && (
                  <th className="border-b p-2 text-left font-medium text-muted-foreground">
                    {mode === "room" ? "No rooms yet" : "No teachers yet"}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {day.slots.map((slot) =>
                slot.kind === "break" ? (
                  <tr key={slot.id} className="bg-muted/50">
                    <td className="p-2 text-muted-foreground">
                      {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                    </td>
                    <td
                      colSpan={Math.max(columns.length, 1)}
                      className="p-2 text-muted-foreground"
                    >
                      {slot.label ?? "Break"}
                    </td>
                  </tr>
                ) : (
                  <tr key={slot.id} className="align-top">
                    <td className="p-2 text-muted-foreground">
                      {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                    </td>
                    {columns.map((col) => {
                      const cellSessions = sessionsForColumn(
                        slot.sessions,
                        col.id,
                      );
                      return (
                        <td key={col.id} className="p-1">
                          <div className="flex flex-col gap-1">
                            {cellSessions.map((session) => (
                              <SessionCell
                                key={session.id}
                                session={session}
                                mode={mode}
                                canEdit={canEdit}
                                courseId={courseId}
                                currentPersonId={currentPersonId}
                              />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    {columns.length === 0 && <td className="p-1" />}
                  </tr>
                ),
              )}
              {day.slots.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-2 text-muted-foreground"
                  >
                    No time slots yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
      {data.days.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No days set up for this course yet.
        </p>
      )}
    </div>
  );

  if (!canEdit) {
    return grid;
  }

  return (
    <div className="flex gap-6">
      <DndContext
        id="timetable-dnd"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1">{grid}</div>
        <aside className="w-48 shrink-0 print:hidden">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">Students</h3>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {data.students.length > 0 && (
            <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={
                  selectedIds.size === data.students.length &&
                  data.students.length > 0
                }
                onChange={toggleSelectAll}
                className="size-4"
              />
              Select all
              {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
            </label>
          )}
          <div className="flex flex-col gap-1">
            {data.students.map((student) => (
              <StudentChip
                key={student.id}
                id={student.id}
                name={student.name}
                skills={student.skills}
                selected={selectedIds.has(student.id)}
                onToggleSelected={() => toggleSelected(student.id)}
              />
            ))}
            {data.students.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No students yet.
              </p>
            )}
          </div>
        </aside>
        <DragOverlay>
          {activeDrag &&
            (selectedIds.has(activeDrag.personId) && selectedIds.size > 1 ? (
              <div className="rounded-md border bg-background px-2 py-1 text-sm shadow-md">
                {selectedIds.size} students
              </div>
            ) : (
              <div className="rounded-md border bg-background px-2 py-1 text-sm shadow-md">
                {activeDrag.name}
              </div>
            ))}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
