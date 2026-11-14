"use client";

import { useEffect, useState } from "react";

import { markStaffConversationReadAction } from "@/app/actions/conversations";
import { Button } from "@/components/ui/button";
import {
  useAssignConversationToSelfMutation,
  useCloseConversationMutation,
  useReopenConversationMutation,
  useResolveConversationMutation,
  useStaffInternalNoteMutation,
  useStaffReplyMutation,
} from "@/hooks/queries/use-admin-conversation-mutations";
import type { AdminConversation, AdminConversationMessage } from "@/types/admin";

function roleLabel(role: AdminConversationMessage["role"]) {
  switch (role) {
    case "ai":
      return "Assistant (AI)";
    case "human":
      return "Team member";
    case "internal_note":
      return "Internal note";
    case "system":
      return "System";
    default:
      return "Customer";
  }
}

export function AdminConversationWorkspace({ conversation }: { conversation: AdminConversation }) {
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const replyMutation = useStaffReplyMutation(conversation.id);
  const noteMutation = useStaffInternalNoteMutation(conversation.id);
  const assignSelf = useAssignConversationToSelfMutation(conversation.id);
  const resolveMutation = useResolveConversationMutation(conversation.id);
  const closeMutation = useCloseConversationMutation(conversation.id);
  const reopenMutation = useReopenConversationMutation(conversation.id);

  useEffect(() => {
    void markStaffConversationReadAction(conversation.id);
  }, [conversation.id]);

  const onReply = async () => {
    setError(null);
    try {
      await replyMutation.mutateAsync({ body: reply, idempotencyKey: crypto.randomUUID() });
      setReply("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send reply.");
    }
  };

  const onNote = async () => {
    setError(null);
    try {
      await noteMutation.mutateAsync(note);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save note.");
    }
  };

  const isClosed = conversation.status === "closed";

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap gap-2 items-center text-sm">
        {conversation.assignedToName ? (
          <span>Assigned to: {conversation.assignedToName}</span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
        {conversation.unreadStaffCount ? (
          <span className="text-xs font-medium">{conversation.unreadStaffCount} unread</span>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={assignSelf.isPending}
          onClick={() => assignSelf.mutate()}
        >
          Assign to me
        </Button>
        {conversation.status !== "resolved" && conversation.status !== "closed" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate()}
          >
            Mark resolved
          </Button>
        ) : null}
        {conversation.status !== "closed" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            Close
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={reopenMutation.isPending}
            onClick={() => reopenMutation.mutate()}
          >
            Reopen
          </Button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <section className="panel space-y-4">
        {conversation.messages.map((m) => (
          <article
            key={m.id}
            className={`p-3 border text-sm ${
              m.role === "customer"
                ? "bg-muted"
                : m.role === "internal_note"
                  ? "border-dashed bg-amber-50/50 dark:bg-amber-950/20"
                  : m.role === "ai"
                    ? "border-primary/30"
                    : ""
            }`}
          >
            <header className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{roleLabel(m.role)}</span>
              <time dateTime={m.at}>{new Date(m.at).toLocaleString()}</time>
            </header>
            <p className="m-0 leading-7 whitespace-pre-wrap">{m.body}</p>
          </article>
        ))}
      </section>

      {!isClosed ? (
        <div className="panel space-y-3">
          <label className="field block">
            <span>Reply to customer</span>
            <textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={4000}
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={!reply.trim() || replyMutation.isPending}
            onClick={() => void onReply()}
          >
            {replyMutation.isPending ? "Sending…" : "Send reply"}
          </Button>

          <label className="field block">
            <span>Internal note (staff only)</span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={4000}
            />
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!note.trim() || noteMutation.isPending}
            onClick={() => void onNote()}
          >
            {noteMutation.isPending ? "Saving…" : "Add internal note"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
