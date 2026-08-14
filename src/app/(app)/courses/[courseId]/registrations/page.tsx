import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/db";
import {
  courses,
  courseRegistrations,
  people,
  skills,
  skillTypes,
} from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CourseRegistrationsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireOrganiserOrAdminPage();
  const { courseId } = await params;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    notFound();
  }

  const registrations = await db
    .select({
      registrationId: courseRegistrations.id,
      notes: courseRegistrations.notes,
      createdAt: courseRegistrations.createdAt,
      personId: people.id,
      name: people.name,
      email: people.email,
      phone: people.phone,
    })
    .from(courseRegistrations)
    .innerJoin(people, eq(courseRegistrations.personId, people.id))
    .where(eq(courseRegistrations.courseId, courseId))
    .orderBy(desc(courseRegistrations.createdAt));

  const personIds = registrations.map((r) => r.personId);
  const personSkills =
    personIds.length > 0
      ? await db
          .select({
            personId: skills.personId,
            skillTypeName: skillTypes.name,
          })
          .from(skills)
          .innerJoin(skillTypes, eq(skills.skillTypeId, skillTypes.id))
          .where(inArray(skills.personId, personIds))
      : [];

  const skillsByPerson = new Map<string, string[]>();
  for (const s of personSkills) {
    if (!skillsByPerson.has(s.personId)) skillsByPerson.set(s.personId, []);
    skillsByPerson.get(s.personId)!.push(s.skillTypeName);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div>
        <Link
          href={`/courses/${course.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {course.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          Registrations ({registrations.length})
        </h1>
      </div>

      {registrations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No registrations yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Instruments</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((r) => (
              <TableRow key={r.registrationId}>
                <TableCell>
                  <Link
                    href={`/people/${r.personId}`}
                    className="underline"
                  >
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell className="whitespace-normal">
                  {(skillsByPerson.get(r.personId) ?? []).join(", ")}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {r.notes}
                </TableCell>
                <TableCell>{format(r.createdAt, "d MMM yyyy")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
