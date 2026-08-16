"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/delete-button";
import { CopyLinkButton } from "./copy-link-button";

type Attachment = {
  pieceId: string;
  pieceTitle: string;
  sessionId: string;
  sessionTitle: string;
  courseName: string;
  dayDate: string;
  startTime: string;
};

type DocumentRow = {
  documentId: string;
  filename: string;
  fileSize: number;
  uploadedByName: string | null;
  createdAt: Date;
  attachments: Attachment[];
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsTable({
  documents,
  canManage,
  deleteAction,
}: {
  documents: DocumentRow[];
  canManage: boolean;
  deleteAction: (documentId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const filtered = documents.filter((doc) => {
    if (!needle) return true;
    if (doc.filename.toLowerCase().includes(needle)) return true;
    return doc.attachments.some(
      (a) =>
        a.courseName.toLowerCase().includes(needle) ||
        a.sessionTitle.toLowerCase().includes(needle) ||
        a.pieceTitle.toLowerCase().includes(needle),
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search by filename, course, or session…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Attached to</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doc) => (
              <TableRow key={doc.documentId}>
                <TableCell className="whitespace-normal font-medium">
                  {doc.filename}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {doc.attachments.length === 0 ? (
                    <span className="text-muted-foreground">
                      Not attached to any piece
                    </span>
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {doc.attachments.map((a) => (
                        <li key={a.pieceId}>
                          {a.pieceTitle} — {a.courseName},{" "}
                          {format(new Date(a.dayDate), "d MMM")}{" "}
                          {a.startTime.slice(0, 5)} · {a.sessionTitle}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell>{doc.uploadedByName ?? "—"}</TableCell>
                <TableCell>{formatSize(doc.fileSize)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CopyLinkButton documentId={doc.documentId} />
                    <a
                      href={`/documents/${doc.documentId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline"
                    >
                      Download
                    </a>
                    {canManage && (
                      <DeleteButton
                        action={deleteAction.bind(null, doc.documentId)}
                        label="Delete"
                        confirmMessage={
                          doc.attachments.length > 0
                            ? `Delete "${doc.filename}" permanently? It's attached to ${doc.attachments.length} piece(s) — this removes their access and cannot be undone.`
                            : `Delete "${doc.filename}" permanently? This cannot be undone.`
                        }
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
