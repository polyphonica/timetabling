import Link from "next/link";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth();
  const canManage =
    session?.user?.role === "admin" || session?.user?.role === "organiser";

  const [activeCourse] = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .orderBy(desc(courses.startDate))
    .limit(1);

  if (!canManage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">
          Tywyn Technologies Timetabling
        </h1>
        {activeCourse ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href={`/courses/${activeCourse.id}/timetable`}
              className="underline"
            >
              {activeCourse.name} timetable
            </Link>
            {session?.user?.personId && (
              <Link
                href={`/courses/${activeCourse.id}/timetable/teacher/${session.user.personId}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                My timetable
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No course has been set up yet.
          </p>
        )}
      </div>
    );
  }

  const links = [
    {
      href: "/courses",
      title: "Courses",
      description: "Set up course dates, days, time slots, breaks and rooms.",
    },
    {
      href: "/people",
      title: "People",
      description: "Manage students, teachers, contact details and skills.",
    },
    {
      href: "/skill-types",
      title: "Skill Types",
      description: "Manage the list of instruments and voice parts.",
    },
    ...(activeCourse
      ? [
          {
            href: `/courses/${activeCourse.id}/timetable`,
            title: "Timetable",
            description: `Schedule sessions and drag students into place for ${activeCourse.name}.`,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 p-8 sm:grid-cols-3">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>{link.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {link.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
