CREATE TABLE "interest_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"group" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "interest_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "registration_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_registration_id" uuid NOT NULL,
	"interest_type_id" uuid NOT NULL,
	CONSTRAINT "registration_interests_course_registration_id_interest_type_id_unique" UNIQUE("course_registration_id","interest_type_id")
);
--> statement-breakpoint
ALTER TABLE "registration_interests" ADD CONSTRAINT "registration_interests_course_registration_id_course_registrations_id_fk" FOREIGN KEY ("course_registration_id") REFERENCES "public"."course_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_interests" ADD CONSTRAINT "registration_interests_interest_type_id_interest_types_id_fk" FOREIGN KEY ("interest_type_id") REFERENCES "public"."interest_types"("id") ON DELETE restrict ON UPDATE no action;