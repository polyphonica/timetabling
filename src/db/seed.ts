import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { people, users } from "./schema";

async function main() {
  const username = "admin";
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    console.log(`User "${username}" already exists, skipping seed.`);
    return;
  }

  const [admin] = await db
    .insert(people)
    .values({
      name: "Site Admin",
      isAdmin: true,
    })
    .returning({ id: people.id });

  const password = randomBytes(9).toString("base64url");
  const passwordHash = await hash(password, 12);

  await db.insert(users).values({
    personId: admin.id,
    username,
    passwordHash,
  });

  console.log("Seeded initial admin login:");
  console.log(`  username: ${username}`);
  console.log(`  password: ${password}`);
  console.log(
    "Change this via the people-management screen once it exists (Phase 1).",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
