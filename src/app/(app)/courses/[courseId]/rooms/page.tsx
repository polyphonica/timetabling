import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses, rooms } from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { DeleteButton } from "@/components/delete-button";
import { AddRoomForm } from "./add-room-form";
import { EditRoomDialog } from "./edit-room-dialog";
import { deleteRoom, updateRoom } from "./actions";

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireOrganiserOrAdminPage();
  const { courseId } = await params;

  const [course] = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    notFound();
  }

  const courseRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.courseId, courseId))
    .orderBy(rooms.name);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-8">
      <div>
        <Link
          href={`/courses/${courseId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {course.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Rooms</h1>
      </div>

      <AddRoomForm courseId={courseId} />

      <ul className="flex flex-col gap-2">
        {courseRooms.map((room) => (
          <li
            key={room.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span>{room.name}</span>
            <div className="flex items-center gap-1">
              <EditRoomDialog
                action={updateRoom.bind(null, courseId, room.id)}
                currentName={room.name}
              />
              <DeleteButton action={deleteRoom.bind(null, courseId, room.id)} />
            </div>
          </li>
        ))}
        {courseRooms.length === 0 && (
          <p className="text-sm text-muted-foreground">No rooms yet.</p>
        )}
      </ul>
    </div>
  );
}
