import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { people } from "./people";

// A reusable uploaded file (e.g. sheet music). Kept separate from
// sessionPieces so the same file can be attached to multiple pieces
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
