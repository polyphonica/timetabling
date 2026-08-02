import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { people, skillTypes, skills, users } from "@/db/schema";
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

  const [allSkillTypes, personSkills, [existingUser]] = await Promise.all([
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
  ]);

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
