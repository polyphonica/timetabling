import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, people } from "@/db/schema";
import type { Role } from "@/types/next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const [record] = await db
          .select({
            userId: users.id,
            passwordHash: users.passwordHash,
            personId: people.id,
            name: people.name,
            isOrganiser: people.isOrganiser,
            isAdmin: people.isAdmin,
          })
          .from(users)
          .innerJoin(people, eq(users.personId, people.id))
          .where(eq(users.username, username))
          .limit(1);

        if (!record) return null;

        const passwordMatches = await compare(password, record.passwordHash);
        if (!passwordMatches) return null;

        const role: Role = record.isAdmin
          ? "admin"
          : record.isOrganiser
            ? "organiser"
            : "teacher";

        return {
          id: record.userId,
          name: record.name,
          personId: record.personId,
          role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.personId = user.personId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.personId = token.personId;
      session.user.role = token.role;
      return session;
    },
  },
});
