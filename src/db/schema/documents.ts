import { pgTable, uuid, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { people } from "./people";
import { sessions } from "./sessions";

// A reusable uploaded file (e.g. sheet music). Kept separate from
// sessionDocuments so the same file can be attached to multiple sessions
// across different courses/years without duplicating storage.
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  fileSize: integer("file_size").notNull(),
  sha256Hash: text("sha256_hash").notNull().unique(),
  uploadedByPersonId: uuid("uploaded_by_person_id").references(() => people.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionDocuments = pgTable(
  "session_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    attachedByPersonId: uuid("attached_by_person_id").references(() => people.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.sessionId, t.documentId)],
);
