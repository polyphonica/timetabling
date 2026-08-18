import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/db";
import { courses, tasks } from "@/db/schema";
import { auth } from "@/auth";
import { DeleteButton } from "@/components/delete-button";
import { AddTaskForm } from "./add-task-form";
import { CompleteButton } from "./complete-button";
import { completeTask, undoTask, deleteTask } from "./actions";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { courseId } = await params;
  const personId = session.user.personId;
  const canManage =
    session.user.role === "admin" || session.user.role === "organiser";

  const [course] = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) notFound();

  const allTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.courseId, courseId), eq(tasks.createdBy, personId)));

  const openTasks = allTasks
    .filter((t) => !t.completedAt)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const doneTasks = allTasks
    .filter((t) => !!t.completedAt)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <Link
          href={canManage ? `/courses/${courseId}` : "/"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {course.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Tasks</h1>
      </div>

      <AddTaskForm courseId={courseId} />

      {openTasks.length === 0 && doneTasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      )}

      {openTasks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {openTasks.map((task) => (
            <li key={task.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      due {task.dueDate}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <CompleteButton
                  action={completeTask.bind(null, courseId, task.id)}
                  isComplete={false}
                />
                <DeleteButton action={deleteTask.bind(null, courseId, task.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {doneTasks.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Completed</h2>
          <ul className="flex flex-col gap-2">
            {doneTasks.map((task) => (
              <li key={task.id} className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-muted-foreground line-through">
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-through whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Completed {format(task.completedAt!, "d MMM yyyy 'at' HH:mm")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CompleteButton
                    action={undoTask.bind(null, courseId, task.id)}
                    isComplete={true}
                  />
                  <DeleteButton action={deleteTask.bind(null, courseId, task.id)} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
