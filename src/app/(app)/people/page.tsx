import Link from "next/link";
import { db } from "@/db";
import { people } from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { CreatePersonDialog } from "./create-person-dialog";

export default async function PeoplePage() {
  await requireOrganiserOrAdminPage();

  const allPeople = await db.select().from(people).orderBy(people.name);

  const totalTeachers = allPeople.filter((person) => person.isTeacher).length;
  const totalStudents = allPeople.length - totalTeachers;

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">People</h1>
        <CreatePersonDialog />
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {totalStudents} students · {totalTeachers} teachers · {allPeople.length} total
      </p>
      <ul className="flex flex-col gap-2">
        {allPeople.map((person) => (
          <li key={person.id}>
            <Link
              href={`/people/${person.id}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent"
            >
              <span>{person.name}</span>
              <span className="flex gap-1">
                {person.isAdmin && <Badge>Admin</Badge>}
                {person.isOrganiser && <Badge>Organiser</Badge>}
                {person.isTeacher && (
                  <Badge className="border-transparent bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    Teacher
                  </Badge>
                )}
                {!person.isTeacher && !person.isOrganiser && !person.isAdmin && (
                  <Badge className="border-transparent bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    Student
                  </Badge>
                )}
              </span>
            </Link>
          </li>
        ))}
        {allPeople.length === 0 && (
          <p className="text-sm text-muted-foreground">No people yet.</p>
        )}
      </ul>
    </div>
  );
}
