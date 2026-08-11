-- New table: session_pieces
CREATE TABLE "session_pieces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "title" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "session_pieces"
  ADD CONSTRAINT "session_pieces_session_id_sessions_id_fk"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE cascade ON UPDATE no action;

-- Add skill_type_id to session_participants
ALTER TABLE "session_participants"
  ADD COLUMN "skill_type_id" uuid;
ALTER TABLE "session_participants"
  ADD CONSTRAINT "session_participants_skill_type_id_skill_types_id_fk"
  FOREIGN KEY ("skill_type_id") REFERENCES "skill_types"("id") ON DELETE set null ON UPDATE no action;
