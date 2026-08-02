import type { DefaultSession } from "next-auth";

export type Role = "admin" | "organiser" | "teacher";

declare module "next-auth" {
  interface User {
    personId: string;
    role: Role;
  }

  interface Session {
    user: {
      personId: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    personId: string;
    role: Role;
  }
}
