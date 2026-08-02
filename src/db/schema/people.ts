import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const people = pgTable("people", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  isTeacher: boolean("is_teacher").notNull().default(false),
  isOrganiser: boolean("is_organiser").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Configurable taxonomy of instrument/voice types (e.g. "Soprano Viol",
// "Sopranino Recorder", "Alto" for voice). Starts empty; Organiser/Admin
// populate it themselves rather than it being a fixed enum.
export const skillTypes = pgTable("skill_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  group: text("group"), // free-text grouping label, e.g. "Viol", "Recorder", "Voice"
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  skillTypeId: uuid("skill_type_id")
    .notNull()
    .references(() => skillTypes.id, { onDelete: "restrict" }),
  proficiency: text("proficiency"),
  notes: text("notes"),
  // 1 = first study, 2 = second study, etc.; null = unranked. Not enforced
  // as unique per person — organiser self-polices.
  studyOrder: integer("study_order"),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" })
    .unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
