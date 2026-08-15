ALTER TYPE "public"."registration_status" ADD VALUE 'withdrawn';--> statement-breakpoint
ALTER TABLE "course_registrations" ADD COLUMN "withdrawal_notes" text;