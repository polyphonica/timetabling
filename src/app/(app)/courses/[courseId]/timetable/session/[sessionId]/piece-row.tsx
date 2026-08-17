"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { unstable_rethrow } from "next/navigation";
import { FileX, MoreVertical, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AttachPieceDocument } from "./attach-piece-document";
import { deletePiece, detachDocumentFromPiece, renamePiece } from "./actions";

type Piece = {
  id: string;
  title: string;
  documentId: string | null;
  documentFilename: string | null;
};

export function PieceRow({
  courseId,
  piece,
  availableDocuments,
}: {
  courseId: string;
  piece: Piece;
  availableDocuments: { id: string; filename: string }[];
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) inputRef.current?.select();
  }, [isRenaming]);

  function runAction(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        unstable_rethrow(err);
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function submitRename(title: string) {
    const trimmed = title.trim();
    if (!trimmed || trimmed === piece.title) {
      setIsRenaming(false);
      return;
    }
    runAction(async () => {
      await renamePiece(courseId, piece.id, trimmed);
      setIsRenaming(false);
    });
  }

  function handleDelete() {
    const warning = piece.documentId
      ? `Delete "${piece.title}"? Its attached file stays in the document library.`
      : `Delete "${piece.title}"?`;
    if (!window.confirm(warning)) return;
    runAction(() => deletePiece(courseId, piece.id));
  }

  function handleDetach() {
    if (
      !window.confirm(
        "Remove this file from this piece? It stays available in the document library.",
      )
    )
      return;
    runAction(() => detachDocumentFromPiece(courseId, piece.id));
  }

  return (
    <li className="flex flex-col gap-1.5 print:block print:break-inside-avoid">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span className="text-muted-foreground">&bull;</span>
          {isRenaming ? (
            <form
              action={(formData) =>
                submitRename(formData.get("title") as string)
              }
              className="min-w-0 flex-1"
            >
              <Input
                ref={inputRef}
                name="title"
                defaultValue={piece.title}
                disabled={isPending}
                autoFocus
                className="h-7 text-sm"
                onBlur={(e) => submitRename(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsRenaming(false);
                }}
              />
            </form>
          ) : (
            <span className="min-w-0 truncate">{piece.title}</span>
          )}
          {piece.documentId && !isRenaming && (
            <a
              href={`/documents/${piece.documentId}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs text-muted-foreground underline"
            >
              {piece.documentFilename}
            </a>
          )}
        </div>
        {!isRenaming && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  className="print:hidden"
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <Pencil /> Rename
              </DropdownMenuItem>
              {piece.documentId ? (
                <DropdownMenuItem onClick={handleDetach}>
                  <FileX /> Remove file
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setIsAttaching((a) => !a)}>
                  <Paperclip /> Attach file
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <Trash2 /> Delete piece
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {isAttaching && !piece.documentId && (
        <div className="ml-4 print:hidden">
          <AttachPieceDocument
            courseId={courseId}
            pieceId={piece.id}
            availableDocuments={availableDocuments}
          />
        </div>
      )}
    </li>
  );
}
