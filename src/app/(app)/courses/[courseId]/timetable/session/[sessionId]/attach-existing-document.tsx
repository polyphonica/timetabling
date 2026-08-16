"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { unstable_rethrow } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { attachExistingDocument } from "./actions";

type LibraryDocument = { id: string; filename: string };

export function AttachExistingDocument({
  courseId,
  sessionId,
  availableDocuments,
}: {
  courseId: string;
  sessionId: string;
  availableDocuments: LibraryDocument[];
}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  if (availableDocuments.length === 0) return null;

  const matches = availableDocuments.filter((d) =>
    d.filename.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function handleAttach(documentId: string) {
    startTransition(async () => {
      try {
        await attachExistingDocument(courseId, sessionId, documentId);
      } catch (err) {
        unstable_rethrow(err);
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Search previously uploaded documents…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      {query && (
        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
          {matches.length === 0 && (
            <li className="text-sm text-muted-foreground">No matches.</li>
          )}
          {matches.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm"
            >
              <span>{doc.filename}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleAttach(doc.id)}
              >
                Attach
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
