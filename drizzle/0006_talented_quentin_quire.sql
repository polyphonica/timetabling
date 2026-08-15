CREATE TYPE "public"."registration_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."rejection_reason" AS ENUM('course_full', 'inexperienced', 'other');--> statement-breakpoint
ALTER TABLE "course_registrations" ADD COLUMN "status" "registration_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_registrations" ADD COLUMN "rejection_reason" "rejection_reason";--> statement-breakpoint
ALTER TABLE "course_registrations" ADD COLUMN "rejection_notes" text;--> statement-breakpoint
-- Registrations that existed before this migration were implicitly treated
-- as accepted (the timetable showed every student regardless of status).
-- Backfill them so nothing disappears; new registrations still default to pending.
UPDATE "course_registrations" SET "status" = 'accepted';