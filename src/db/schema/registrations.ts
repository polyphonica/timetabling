import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { people } from "./people";

export const courseRegistrations = pgTable(
  "course_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.courseId, t.personId)],
);
