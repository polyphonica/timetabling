"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { unstable_rethrow } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  uploadDocumentForPiece,
  attachExistingDocumentToPiece,
} from "./actions";

type LibraryDocument = { id: string; filename: string };

export function AttachPieceDocument({
  courseId,
  pieceId,
  availableDocuments,
}: {
  courseId: string;
  pieceId: string;
  availableDocuments: LibraryDocument[];
}) {
  const uploadForPiece = uploadDocumentForPiece.bind(null, courseId, pieceId);
  const [state, formAction, isPending] = useActionState(
    uploadForPiece,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  const [query, setQuery] = useState("");
  const [isAttaching, startTransition] = useTransition();

  const matches = query.trim()
    ? availableDocuments.filter((d) =>
        d.filename.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : [];

  function handleAttach(documentId: string) {
    startTransition(async () => {
      try {
        await attachExistingDocumentToPiece(courseId, pieceId, documentId);
      } catch (err) {
        unstable_rethrow(err);
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-dashed p-2">
      <form
        ref={formRef}
        action={formAction}
        className="flex items-center gap-2"
      >
        <input
          type="file"
          name="file"
          accept="application/pdf"
          className="flex-1 text-xs"
        />
        <Button type="submit" size="xs" disabled={isPending}>
          {isPending ? "Uploading…" : "Upload"}
        </Button>
      </form>
      {state?.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      {availableDocuments.length > 0 && (
        <div className="flex flex-col gap-1">
          <Input
            placeholder="…or attach a previously uploaded file"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 text-xs"
          />
          {matches.length > 0 && (
            <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto">
              {matches.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs"
                >
                  <span>{doc.filename}</span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={isAttaching}
                    onClick={() => handleAttach(doc.id)}
                  >
                    Attach
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
