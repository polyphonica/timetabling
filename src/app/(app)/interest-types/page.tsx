import { db } from "@/db";
import { interestTypes } from "@/db/schema";
import { requireOrganiserOrAdminPage } from "@/lib/auth-helpers";
import { DeleteButton } from "@/components/delete-button";
import { AddInterestTypeForm } from "./add-interest-type-form";
import { EditInterestTypeDialog } from "./edit-interest-type-dialog";
import { deleteInterestType, updateInterestType } from "./actions";

export default async function InterestTypesPage() {
  await requireOrganiserOrAdminPage();

  const types = await db
    .select()
    .from(interestTypes)
    .orderBy(interestTypes.group, interestTypes.name);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Interests</h1>
        <p className="text-sm text-muted-foreground">
          Activities or ensembles students can express interest in when
          registering, e.g. &quot;One-to-a-part vocal ensemble&quot; or
          &quot;Lute song&quot; — used to help place them in sessions, not a
          record of what they can play.
        </p>
      </div>

      <AddInterestTypeForm />

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
            <EditInterestTypeDialog
              action={updateInterestType.bind(null, type.id)}
              currentName={type.name}
              currentGroup={type.group}
            />
            <DeleteButton action={deleteInterestType.bind(null, type.id)} />
          </li>
        ))}
        {types.length === 0 && (
          <p className="text-sm text-muted-foreground">No interests yet.</p>
        )}
      </ul>
    </div>
  );
}
