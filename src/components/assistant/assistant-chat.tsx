"use client";

import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  sendAssistantMessageAction,
  startAssistantConversationAction,
} from "@/app/actions/assistant";
import { AssistantFullViewLink } from "@/components/assistant/assistant-full-view-link";
import { AssistantMessage } from "@/components/assistant/assistant-message";
import { EmptyState } from "@/components/page-ui";
import { Button } from "@/components/ui/button";
import type { AssistantChatMessage, AssistantErrorCode } from "@/types/assistant";

const HISTORY_KEY = "elanskin_assistant_sessions_v1";

type StoredSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AssistantChatMessage[];
};

type Props = {
  mode: "page" | "panel";
  customerName?: string | undefined;
  dietaryHint?: string | undefined;
  recentFocus?: string | undefined;
};

function loadSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSession(session: StoredSession) {
  const others = loadSessions().filter((s) => s.id !== session.id);
  const next = [session, ...others].slice(0, 8);
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function errorMessage(code: AssistantErrorCode, message: string): AssistantChatMessage {
  return {
    id: `err-${Date.now()}`,
    role: "assistant",
    createdAt: new Date().toISOString(),
    content: { type: "error", code, message },
  };
}

export function AssistantChat({
  mode,
  customerName,
  dietaryHint = "Not set",
  recentFocus = "Weekly shop",
}: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [quickActions, setQuickActions] = useState<{ id: string; label: string; prompt: string }[]>(
    [],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const persist = useCallback((nextMessages: AssistantChatMessage[], id: string) => {
    const firstUser = nextMessages.find((m) => m.role === "user");
    const title =
      firstUser?.content.type === "text" ? firstUser.content.text.slice(0, 48) : "Grocery chat";
    const session: StoredSession = {
      id,
      title,
      updatedAt: new Date().toISOString(),
      messages: nextMessages,
    };
    saveSession(session);
    setSessions(loadSessions());
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setBootError(null);
    try {
      const start = await startAssistantConversationAction();
      setConversationId(start.conversationId);
      setMessages([start.welcome]);
      setSuggested(start.suggestedPrompts);
      setQuickActions(start.quickActions);
      setSessions(loadSessions());
    } catch {
      setBootError("The shopping assistant is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !conversationId || typing) return;

    const userMessage: AssistantChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      createdAt: new Date().toISOString(),
      content: { type: "text", text: trimmed },
    };
    const optimistic = [...messages, userMessage];
    setMessages(optimistic);
    setInput("");
    setTyping(true);

    try {
      const result = await sendAssistantMessageAction(conversationId, trimmed);
      if (!result.ok) {
        const next = [...optimistic, errorMessage(result.code, result.message)];
        setMessages(next);
        persist(next, conversationId);
        return;
      }
      const next = [...optimistic, result.message];
      setMessages(next);
      persist(next, conversationId);
    } catch {
      const next = [
        ...optimistic,
        errorMessage("api_failure", "We couldn't reach the assistant. Please try again."),
      ];
      setMessages(next);
      persist(next, conversationId);
    } finally {
      setTyping(false);
    }
  };

  const loadSession = (session: StoredSession) => {
    setConversationId(session.id);
    setMessages(session.messages);
  };

  if (loading) {
    return (
      <div className="chat-main assistant-loading" aria-busy="true" aria-live="polite">
        <Loader2 className="animate-spin mx-auto mt-24" aria-hidden />
        <p className="text-center text-sm text-muted-foreground mt-4">Preparing your assistant…</p>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="chat-main">
        <EmptyState title="Assistant unavailable" copy={bootError} />
        <Button type="button" className="mx-auto mt-4 block" onClick={() => void bootstrap()}>
          Try again
        </Button>
      </div>
    );
  }

  const showEmptyHints = !messages.some((m) => m.role === "user");

  return (
    <div className={`assistant-layout ${mode === "panel" ? "assistant-layout-panel" : ""}`}>
      {mode === "page" ? (
        <aside className="assistant-side" aria-label="Conversation history">
          <h3>Recent chats</h3>
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground leading-6">
              Your session history appears here.
            </p>
          ) : (
            <div className="quick-prompts mt-3">
              {sessions.map((s) => (
                <button type="button" key={s.id} onClick={() => loadSession(s)}>
                  {s.title}
                </button>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => void bootstrap()}
          >
            New conversation
          </Button>
        </aside>
      ) : null}

      <section className="chat-main" aria-label="Shopping assistant conversation">
        <header className="chat-header">
          <span className="ai-dot" aria-hidden />
          <div>
            <strong className="text-sm">Greencart · Shopping assistant</strong>
            <p className="text-xs text-muted-foreground m-0">
              Live catalog prices · Check labels for allergens
            </p>
          </div>
          {mode === "panel" ? (
            <AssistantFullViewLink className="assistant-full-view-link ml-auto">
              Open full view
            </AssistantFullViewLink>
          ) : null}
        </header>

        <div className="messages" ref={listRef} tabIndex={0} aria-live="polite">
          {mode === "panel" && showEmptyHints ? (
            <p className="text-sm text-muted-foreground leading-6 m-0">
              Ask about groceries, meal ideas, dietary needs, or your orders when signed in.
            </p>
          ) : null}
          {mode === "page" && showEmptyHints ? (
            <EmptyState
              title="What are you shopping for today?"
              copy="Find groceries, compare products, get meal ideas from what's in stock, or check an order."
            />
          ) : null}
          {messages.map((m) => (
            <AssistantMessage key={m.id} message={m} />
          ))}
          {typing ? (
            <div className="message assistant-typing" aria-live="polite" aria-busy="true">
              <span className="assistant-typing-dots" aria-hidden>
                …
              </span>
              <span className="sr-only">Assistant is typing</span>
            </div>
          ) : null}
        </div>

        {mode === "panel" && suggested.length > 0 ? (
          <div className="assistant-panel-suggestions" aria-label="Suggested questions">
            {suggested.slice(0, 3).map((prompt) => (
              <button
                type="button"
                key={prompt}
                className="assistant-panel-suggestion-chip"
                onClick={() => void send(prompt)}
                disabled={typing}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label
            className="sr-only"
            htmlFor={mode === "panel" ? "assistant-input-panel" : "assistant-input-page"}
          >
            Message the shopping assistant
          </label>
          <input
            id={mode === "panel" ? "assistant-input-panel" : "assistant-input-page"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about groceries, meals, or orders…"
            disabled={typing}
            maxLength={2000}
          />
          <Button
            type="submit"
            variant="icon"
            aria-label="Send message"
            disabled={typing || !input.trim()}
          >
            <Send size={16} />
          </Button>
        </form>
      </section>

      {mode === "page" ? (
        <aside className="assistant-side" aria-label="Suggestions and profile context">
          <h3>Your context</h3>
          <div className="panel text-xs leading-6">
            <p className="m-0">
              <strong>{customerName ?? "Guest"}</strong>
            </p>
            <p className="text-muted-foreground m-0 mt-2">Dietary preference: {dietaryHint}</p>
            <p className="text-muted-foreground m-0">Recent focus: {recentFocus}</p>
          </div>

          <h3 className="mt-6">Suggested questions</h3>
          <div className="quick-prompts">
            {suggested.map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => void send(prompt)}
                disabled={typing}
              >
                {prompt}
              </button>
            ))}
          </div>

          <h3 className="mt-6">Quick actions</h3>
          <div className="quick-prompts">
            {quickActions.map((action) => (
              <button
                type="button"
                key={action.id}
                onClick={() => void send(action.prompt)}
                disabled={typing}
              >
                {action.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground leading-6 mt-6">
            The assistant uses controlled catalog and account services. It cannot access databases
            directly, change orders, payments, or inventory, or run arbitrary commands. AI responses
            are informational only—always verify details on product and order pages.
          </p>
        </aside>
      ) : null}
    </div>
  );
}
