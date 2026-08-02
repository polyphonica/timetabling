import { db } from "@/db";
import { skillTypes } from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { DeleteButton } from "@/components/delete-button";
import { AddSkillTypeForm } from "./add-skill-type-form";
import { deleteSkillType } from "./actions";

export default async function SkillTypesPage() {
  await requireOrganiserOrAdminPage();

  const types = await db
    .select()
    .from(skillTypes)
    .orderBy(skillTypes.group, skillTypes.name);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Skill Types</h1>
        <p className="text-sm text-muted-foreground">
          Instruments and voice parts, e.g. &quot;Soprano Viol&quot; or
          &quot;Alto&quot;. Not pre-populated — add whatever your teachers and
          students actually play or sing.
        </p>
      </div>

      <AddSkillTypeForm />

      <ul className="flex flex-col gap-2">
        {types.map((type) => (
          <li
            key={type.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span>
              {type.name}
              {type.group && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {type.group}
                </span>
              )}
            </span>
            <DeleteButton action={deleteSkillType.bind(null, type.id)} />
          </li>
        ))}
        {types.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No skill types yet.
          </p>
        )}
      </ul>
    </div>
  );
}
