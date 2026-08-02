"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getThreadMessages, sendMessage, type ThreadMessage } from "@/lib/messaging";

const POLL_INTERVAL_MS = 4000;

export function MessageThreadDialog({
  sessionId,
  sessionTitle,
  initialCount,
  currentPersonId,
}: {
  sessionId: string;
  sessionTitle: string;
  initialCount: number;
  currentPersonId: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [count, setCount] = useState(initialCount);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function refresh() {
      const rows = await getThreadMessages(sessionId);
      if (cancelled) return;
      setMessages(rows);
      setCount(rows.length);
    }

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, sessionId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSend() {
    const value = body.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const result = await sendMessage(sessionId, value);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setBody("");
      const rows = await getThreadMessages(sessionId);
      setMessages(rows);
      setCount(rows.length);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Messages for ${sessionTitle}`}
            className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground print:hidden"
          >
            <MessageSquare className="size-3.5" />
            {count > 0 && <span>{count}</span>}
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sessionTitle}</DialogTitle>
        </DialogHeader>
        <div
          ref={listRef}
          className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border p-2"
        >
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex max-w-[85%] flex-col rounded-md px-2 py-1 text-sm ${
                m.authorId === currentPersonId
                  ? "self-end bg-primary/10"
                  : "self-start bg-muted"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{m.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(m.createdAt), "d MMM HH:mm")}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            size="sm"
            className="self-end"
            disabled={isPending || !body.trim()}
            onClick={handleSend}
          >
            {isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
