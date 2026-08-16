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
  registrationInterests,
  interestTypes,
} from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { isCourseClosed } from "@/lib/course-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionCounts, getUnregisteredPeople } from "./actions";
import { AddRegistrationForm } from "./add-registration-form";
import {
  RegistrationActions,
  RegistrationStatusBadge,
} from "./registration-status";

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
      status: courseRegistrations.status,
      rejectionReason: courseRegistrations.rejectionReason,
      rejectionNotes: courseRegistrations.rejectionNotes,
      withdrawalNotes: courseRegistrations.withdrawalNotes,
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

  const unregisteredPeople = await getUnregisteredPeople(courseId);
  const sessionCounts = await getSessionCounts(courseId);
  const closed = isCourseClosed(course);

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

  const registrationIds = registrations.map((r) => r.registrationId);
  const declaredInterests =
    registrationIds.length > 0
      ? await db
          .select({
            registrationId: registrationInterests.courseRegistrationId,
            interestTypeName: interestTypes.name,
          })
          .from(registrationInterests)
          .innerJoin(
            interestTypes,
            eq(registrationInterests.interestTypeId, interestTypes.id),
          )
          .where(inArray(registrationInterests.courseRegistrationId, registrationIds))
      : [];

  const interestsByRegistration = new Map<string, string[]>();
  for (const i of declaredInterests) {
    if (!interestsByRegistration.has(i.registrationId)) {
      interestsByRegistration.set(i.registrationId, []);
    }
    interestsByRegistration.get(i.registrationId)!.push(i.interestTypeName);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-8">
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
        <p className="mt-1 text-sm text-muted-foreground">
          Only accepted students appear in the timetable&apos;s student list
          and can be scheduled into sessions.
        </p>
      </div>

      {!closed && (
        <AddRegistrationForm courseId={courseId} people={unregisteredPeople} />
      )}

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
              <TableHead>Interests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
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
                  {(interestsByRegistration.get(r.registrationId) ?? []).join(
                    ", ",
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <RegistrationStatusBadge status={r.status} />
                    {r.status === "rejected" && r.rejectionReason && (
                      <span className="text-xs text-muted-foreground">
                        {REASON_LABELS[r.rejectionReason]}
                        {r.rejectionReason === "other" &&
                          r.rejectionNotes &&
                          `: ${r.rejectionNotes}`}
                      </span>
                    )}
                    {r.status === "withdrawn" && r.withdrawalNotes && (
                      <span className="text-xs text-muted-foreground">
                        {r.withdrawalNotes}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {r.notes}
                </TableCell>
                <TableCell>{format(r.createdAt, "d MMM yyyy")}</TableCell>
                <TableCell>
                  {!closed && (
                    <RegistrationActions
                      courseId={courseId}
                      registrationId={r.registrationId}
                      status={r.status}
                      rejectionReason={r.rejectionReason}
                      rejectionNotes={r.rejectionNotes}
                      withdrawalNotes={r.withdrawalNotes}
                      sessionCount={sessionCounts[r.personId] ?? 0}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

const REASON_LABELS: Record<"course_full" | "inexperienced" | "other", string> = {
  course_full: "Course full",
  inexperienced: "Inexperienced",
  other: "Other",
};
