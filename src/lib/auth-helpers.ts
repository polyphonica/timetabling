import { redirect } from "next/navigation";
import { auth } from "@/auth";

// For use in Server Actions: throws, so the caller sees an explicit failure.
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session;
}

export async function requireOrganiserOrAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin" && session.user.role !== "organiser") {
    throw new Error("Forbidden: requires organiser or admin role");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: requires admin role");
  }
  return session;
}

// For use in page Server Components: redirects rather than throwing,
// so a teacher hitting a management URL directly lands somewhere sane.
export async function requireOrganiserOrAdminPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "organiser") {
    redirect("/");
  }
  return session!;
}
