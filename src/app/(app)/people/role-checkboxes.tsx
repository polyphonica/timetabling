export function RoleCheckboxes({
  defaults,
}: {
  defaults?: { isTeacher: boolean; isOrganiser: boolean; isAdmin: boolean };
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isTeacher"
          defaultChecked={defaults?.isTeacher}
          className="size-4"
        />
        Teacher
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isOrganiser"
          defaultChecked={defaults?.isOrganiser}
          className="size-4"
        />
        Organiser (course lead — full scheduling rights)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAdmin"
          defaultChecked={defaults?.isAdmin}
          className="size-4"
        />
        Admin (full scheduling rights + raw data access)
      </label>
    </div>
  );
}
