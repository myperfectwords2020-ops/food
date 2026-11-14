"use server";

import { runSecureAction } from "@/lib/api/secure-action";
import {
  addInternalNote,
  assignConversation,
  closeConversation,
  loadOlderStaffMessages,
  markStaffMessagesRead,
  reopenConversation,
  resolveConversation,
  sendStaffReply,
  unassignConversation,
} from "@/modules/conversations/conversation.service";

export async function staffReplyConversationAction(
  conversationId: string,
  body: string,
  idempotencyKey?: string,
) {
  return runSecureAction("conversations.reply", (ctx) =>
    sendStaffReply(ctx, conversationId, body, idempotencyKey),
  );
}

export async function staffInternalNoteAction(conversationId: string, body: string) {
  return runSecureAction("conversations.internal_note", (ctx) =>
    addInternalNote(ctx, conversationId, body),
  );
}

export async function assignConversationAction(conversationId: string, assigneeUserId: string) {
  return runSecureAction("conversations.assign", (ctx) =>
    assignConversation(ctx, conversationId, assigneeUserId),
  );
}

export async function assignConversationToSelfAction(conversationId: string) {
  return runSecureAction("conversations.reply", async (ctx) => {
    if (!ctx.userId) throw new Error("Missing user.");
    await assignConversation(ctx, conversationId, ctx.userId);
  });
}

export async function unassignConversationAction(conversationId: string) {
  return runSecureAction("conversations.assign", (ctx) =>
    unassignConversation(ctx, conversationId),
  );
}

export async function resolveConversationAction(conversationId: string) {
  return runSecureAction("conversations.resolve", (ctx) =>
    resolveConversation(ctx, conversationId),
  );
}

export async function closeConversationAction(conversationId: string) {
  return runSecureAction("conversations.close", (ctx) => closeConversation(ctx, conversationId));
}

export async function reopenConversationAction(conversationId: string) {
  return runSecureAction("conversations.resolve", (ctx) => reopenConversation(ctx, conversationId));
}

export async function markStaffConversationReadAction(conversationId: string) {
  return runSecureAction("conversations.read", (ctx) => markStaffMessagesRead(ctx, conversationId));
}

export async function loadOlderConversationMessagesAction(conversationId: string, cursor: string) {
  return runSecureAction("conversations.read", (ctx) =>
    loadOlderStaffMessages(ctx, conversationId, cursor),
  );
}
