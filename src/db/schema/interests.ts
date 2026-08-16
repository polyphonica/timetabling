import { pgTable, uuid, text, integer, unique } from "drizzle-orm/pg-core";
import { courseRegistrations } from "./registrations";

// Configurable taxonomy of activities/ensembles a student might want to be
// placed in (e.g. "One-to-a-part vocal ensemble", "Lute song") — distinct
// from skillTypes (what they can play) since this is what they'd like to
// do, not a proficiency. Organiser/Admin populate it, same as skillTypes.
export const interestTypes = pgTable("interest_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  group: text("group"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Declared per course registration, not standing on the person — which
// activities are on offer (and which ones a student wants) varies by
// course, unlike instrument skills which carry over between courses.
export const registrationInterests = pgTable(
  "registration_interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseRegistrationId: uuid("course_registration_id")
      .notNull()
      .references(() => courseRegistrations.id, { onDelete: "cascade" }),
    interestTypeId: uuid("interest_type_id")
      .notNull()
      .references(() => interestTypes.id, { onDelete: "restrict" }),
  },
  (t) => [unique().on(t.courseRegistrationId, t.interestTypeId)],
);
