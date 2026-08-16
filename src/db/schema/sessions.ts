import { pgTable, uuid, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { timeSlots, rooms } from "./courses";
import { people, skillTypes } from "./people";
import { documents } from "./documents";

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  timeSlotId: uuid("time_slot_id")
    .notNull()
    .references(() => timeSlots.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  title: text("title").notNull(),
});

export const sessionTeachers = pgTable(
  "session_teachers",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.personId] })],
);

export const sessionParticipants = pgTable(
  "session_participants",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    skillTypeId: uuid("skill_type_id").references(() => skillTypes.id, {
      onDelete: "set null",
    }),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.personId] })],
);

export const sessionPieces = pgTable("session_pieces", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
