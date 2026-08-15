import {
  pgTable,
  uuid,
  text,
  date,
  time,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  venue: text("venue"),
  createdFromCourseId: uuid("created_from_course_id"),
  // Courses auto-close (read-only) once endDate has passed; this lets an
  // organiser/admin manually override that to fix something afterwards.
  reopened: boolean("reopened").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courseDays = pgTable("course_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  label: text("label"),
});

export const slotKindEnum = pgEnum("slot_kind", ["session", "break"]);

export const timeSlots = pgTable("time_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseDayId: uuid("course_day_id")
    .notNull()
    .references(() => courseDays.id, { onDelete: "cascade" }),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  kind: slotKindEnum("kind").notNull().default("session"),
  label: text("label"),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});
