CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"sha256_hash" text NOT NULL,
	"uploaded_by_person_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_sha256_hash_unique" UNIQUE("sha256_hash")
);
--> statement-breakpoint
CREATE TABLE "session_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"attached_by_person_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_documents_session_id_document_id_unique" UNIQUE("session_id","document_id")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_person_id_people_id_fk" FOREIGN KEY ("uploaded_by_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_documents" ADD CONSTRAINT "session_documents_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_documents" ADD CONSTRAINT "session_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_documents" ADD CONSTRAINT "session_documents_attached_by_person_id_people_id_fk" FOREIGN KEY ("attached_by_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;