import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";
import { people } from "./people";

export const threads = pgTable("threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .unique(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
