import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Privacy notice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last updated August 2026
        </p>
      </div>

      <div className="flex flex-col gap-4 text-sm leading-relaxed">
        <p>
          This notice explains what happens to your personal data when you
          register for a course using this site.
        </p>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-medium">What we collect</h2>
          <p>
            When you register, we collect your name, email address, phone
            number, the instruments or voice parts you play, and any
            optional notes you choose to add.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-medium">Why we collect it</h2>
          <p>
            We use this information to organise the course: to plan and
            schedule your sessions, to place you with appropriate tutors and
            groups, and to contact you about the course. We collect this
            data because it&apos;s necessary to organise a course you&apos;ve
            asked to take part in, not because we&apos;ve asked for your
            consent — so if you&apos;d rather we didn&apos;t hold it, the
            way to act on that is to ask us to delete it (see below), not to
            &quot;withdraw consent,&quot; since withholding this information
            would mean we&apos;re unable to schedule you into the course.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-medium">Who sees it</h2>
          <p>
            Your details are visible to the course organiser and the
            tutors teaching your sessions, through this scheduling
            application. We don&apos;t sell, share, or otherwise pass your
            information to any third party.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-medium">How long we keep it</h2>
          <p>
            We keep your details indefinitely, so that you don&apos;t need
            to re-enter them from scratch if you register for a future
            course, unless you ask us to delete them (see below).
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-medium">Your rights</h2>
          <p>
            You can ask to see the information we hold about you, ask us to
            correct it, or ask us to delete it, at any time. To do any of
            these, email{" "}
            <a
              href="mailto:michaelpiraner@gmail.com"
              className="underline"
            >
              michaelpiraner@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
