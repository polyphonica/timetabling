import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  people,
  skillTypes,
  skills,
  users,
  courses,
  courseRegistrations,
  registrationInterests,
  interestTypes,
} from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { EditPersonForm } from "./edit-person-form";
import { SkillsSection } from "./skills-section";
import { LoginSection } from "./login-section";
import { deletePerson } from "../actions";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  await requireOrganiserOrAdminPage();
  const { personId } = await params;

  const [person] = await db
    .select()
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);

  if (!person) {
    notFound();
  }

  const [allSkillTypes, personSkills, [existingUser], registrations] =
    await Promise.all([
      db.select().from(skillTypes).orderBy(skillTypes.group, skillTypes.name),
      db
        .select({
          id: skills.id,
          skillTypeId: skills.skillTypeId,
          skillTypeName: skillTypes.name,
          proficiency: skills.proficiency,
          notes: skills.notes,
          studyOrder: skills.studyOrder,
        })
        .from(skills)
        .innerJoin(skillTypes, eq(skills.skillTypeId, skillTypes.id))
        .where(eq(skills.personId, personId))
        .orderBy(skills.studyOrder, skillTypes.name),
      db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.personId, personId))
        .limit(1),
      db
        .select({
          registrationId: courseRegistrations.id,
          status: courseRegistrations.status,
          courseId: courses.id,
          courseName: courses.name,
        })
        .from(courseRegistrations)
        .innerJoin(courses, eq(courseRegistrations.courseId, courses.id))
        .where(eq(courseRegistrations.personId, personId))
        .orderBy(courses.startDate),
    ]);

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

  const canHaveLogin = person.isTeacher || person.isOrganiser || person.isAdmin;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/people"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All people
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{person.name}</h1>
        </div>
        <DeleteButton
          action={deletePerson.bind(null, person.id)}
          label="Remove person"
          confirmMessage={`Remove ${person.name}? This also removes their skills, login, and any session assignments.`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPersonForm key={JSON.stringify(person)} person={person} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsSection
            personId={person.id}
            availableSkillTypes={allSkillTypes}
            personSkills={personSkills}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not registered for any courses yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {registrations.map((r) => (
                <li
                  key={r.registrationId}
                  className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/courses/${r.courseId}/registrations`}
                      className="font-medium underline"
                    >
                      {r.courseName}
                    </Link>
                    <span className="text-xs text-muted-foreground capitalize">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {(interestsByRegistration.get(r.registrationId) ?? [])
                      .join(", ") || "No interests declared"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginSection
            personId={person.id}
            canHaveLogin={canHaveLogin}
            existingUser={existingUser ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
