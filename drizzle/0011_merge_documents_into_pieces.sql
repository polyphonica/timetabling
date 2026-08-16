ALTER TABLE "session_documents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "session_documents" CASCADE;--> statement-breakpoint
ALTER TABLE "session_pieces" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "session_pieces" ADD CONSTRAINT "session_pieces_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;