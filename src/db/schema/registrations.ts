import { pgTable, uuid, text, timestamp, unique, pgEnum } from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { people } from "./people";

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const rejectionReasonEnum = pgEnum("rejection_reason", [
  "course_full",
  "inexperienced",
  "other",
]);

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
    status: registrationStatusEnum("status").notNull().default("pending"),
    rejectionReason: rejectionReasonEnum("rejection_reason"),
    rejectionNotes: text("rejection_notes"),
    withdrawalNotes: text("withdrawal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.courseId, t.personId)],
);
