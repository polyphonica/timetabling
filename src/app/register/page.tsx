import { redirect } from "next/navigation";
import { getLiveCourse } from "@/lib/course-status";

export default async function RegisterRedirectPage() {
  const liveCourse = await getLiveCourse();

  if (!liveCourse) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2 p-8">
        <h1 className="text-xl font-semibold">No course open for registration</h1>
        <p className="text-sm text-muted-foreground">
          There isn&apos;t a course currently accepting registrations. Please
          check back later.
        </p>
      </div>
    );
  }

  redirect(`/register/${liveCourse.id}`);
}
