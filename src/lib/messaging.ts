"use server";

import { z } from "zod";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { threads, messages, people } from "@/db/schema";
import { requireSession } from "@/lib/auth-helpers";

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

const messageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(4000),
});

async function getOrCreateThread(sessionId: string): Promise<string> {
  const [existing] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(eq(threads.sessionId, sessionId))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(threads)
    .values({ sessionId, title: "Session messages" })
    .onConflictDoNothing({ target: threads.sessionId })
    .returning({ id: threads.id });
  if (created) return created.id;

  // Lost the race to create the thread — someone else just did.
  const [thread] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(eq(threads.sessionId, sessionId))
    .limit(1);
  return thread.id;
}

export async function getThreadMessages(
  sessionId: string,
): Promise<ThreadMessage[]> {
  await requireSession();

  const [thread] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(eq(threads.sessionId, sessionId))
    .limit(1);
  if (!thread) return [];

  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      authorId: messages.authorId,
      authorName: people.name,
    })
    .from(messages)
    .innerJoin(people, eq(messages.authorId, people.id))
    .where(eq(messages.threadId, thread.id))
    .orderBy(asc(messages.createdAt));

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export type SendMessageState = { error?: string } | undefined;

export async function sendMessage(
  sessionId: string,
  body: string,
): Promise<SendMessageState> {
  const session = await requireSession();

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const threadId = await getOrCreateThread(sessionId);

  await db.insert(messages).values({
    threadId,
    authorId: session.user.personId,
    body: parsed.data.body,
  });

  return undefined;
}

export async function getMessageCounts(
  sessionIds: string[],
): Promise<Record<string, number>> {
  if (sessionIds.length === 0) return {};

  const rows = await db
    .select({
      sessionId: threads.sessionId,
      count: sql<number>`count(${messages.id})`.mapWith(Number),
    })
    .from(threads)
    .innerJoin(messages, eq(messages.threadId, threads.id))
    .where(inArray(threads.sessionId, sessionIds))
    .groupBy(threads.sessionId);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.sessionId) counts[row.sessionId] = row.count;
  }
  return counts;
}
