import Link from "next/link";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { SignOutButton } from "@/components/sign-out-button";

const MANAGE_NAV_ITEMS = [
  { href: "/courses", label: "Courses" },
  { href: "/people", label: "People" },
  { href: "/skill-types", label: "Skill Types" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const canManage =
    session?.user?.role === "admin" || session?.user?.role === "organiser";

  const [activeCourse] = await db
    .select({ id: courses.id })
    .from(courses)
    .orderBy(desc(courses.startDate))
    .limit(1);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3 print:hidden">
        <nav className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            Higham Hall
          </Link>
          {activeCourse && (
            <Link
              href={`/courses/${activeCourse.id}/timetable`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Timetable
            </Link>
          )}
          {canManage &&
            MANAGE_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session?.user?.name} ({session?.user?.role})
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
