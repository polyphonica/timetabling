import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { skillTypes, skills, people } from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";

const studyOrderLabels: Record<number, string> = {
  1: "1st study",
  2: "2nd study",
  3: "3rd study",
};

function studyOrderLabel(studyOrder: number | null) {
  if (studyOrder === null) return null;
  return studyOrderLabels[studyOrder] ?? `${studyOrder}th study`;
}

export default async function SkillTypeDetailPage({
  params,
}: {
  params: Promise<{ skillTypeId: string }>;
}) {
  await requireOrganiserOrAdminPage();
  const { skillTypeId } = await params;

  const [skillType] = await db
    .select()
    .from(skillTypes)
    .where(eq(skillTypes.id, skillTypeId))
    .limit(1);

  if (!skillType) {
    notFound();
  }

  const assigned = await db
    .select({
      personId: people.id,
      name: people.name,
      isTeacher: people.isTeacher,
      proficiency: skills.proficiency,
      notes: skills.notes,
      studyOrder: skills.studyOrder,
    })
    .from(skills)
    .innerJoin(people, eq(skills.personId, people.id))
    .where(eq(skills.skillTypeId, skillTypeId))
    .orderBy(people.name);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-8">
      <div>
        <Link
          href="/skill-types"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Skill Types
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {skillType.name}
          {skillType.group && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {skillType.group}
            </span>
          )}
        </h1>
      </div>

      <ul className="flex flex-col gap-2">
        {assigned.map((a) => (
          <li
            key={a.personId}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <Link href={`/people/${a.personId}`} className="hover:underline">
              {a.name}
            </Link>
            <span className="flex gap-2 text-sm text-muted-foreground">
              {a.isTeacher && <span>Teacher</span>}
              {studyOrderLabel(a.studyOrder) && (
                <span>{studyOrderLabel(a.studyOrder)}</span>
              )}
              {a.proficiency && <span>{a.proficiency}</span>}
            </span>
          </li>
        ))}
        {assigned.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No one has this skill assigned yet.
          </p>
        )}
      </ul>
    </div>
  );
}
