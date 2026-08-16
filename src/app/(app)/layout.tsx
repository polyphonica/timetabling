import Link from "next/link";
import { auth } from "@/auth";
import { getLiveCourse } from "@/lib/course-status";
import { SignOutButton } from "@/components/sign-out-button";

const MANAGE_NAV_ITEMS = [
  { href: "/courses", label: "Courses" },
  { href: "/people", label: "People" },
  { href: "/skill-types", label: "Skill Types" },
  { href: "/interest-types", label: "Interests" },
  { href: "/documents", label: "Documents" },
];

const BRAND_HREF = "https://timetabling.recorder-ed.com/";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const canManage =
    session?.user?.role === "admin" || session?.user?.role === "organiser";

  const liveCourse = await getLiveCourse();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3 print:hidden">
        <nav className="flex items-center gap-4">
          <Link
            href={BRAND_HREF}
            title="Tywyn Technologies Timetabling"
            className="font-heading text-lg font-semibold text-primary"
          >
            TTT
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Home
          </Link>
          {liveCourse &&
            (canManage ? (
              <Link
                href={`/courses/${liveCourse.id}`}
                className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground hover:bg-accent/70"
              >
                Administering: {liveCourse.name}
              </Link>
            ) : (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {liveCourse.name}
              </span>
            ))}
          {liveCourse && (
            <Link
              href={`/courses/${liveCourse.id}/timetable`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Timetable
            </Link>
          )}
          {liveCourse && canManage && (
            <Link
              href={`/courses/${liveCourse.id}/registrations`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Registrations
            </Link>
          )}
          {canManage &&
            MANAGE_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-primary"
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
