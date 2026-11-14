"use client";

import { AssistantComparison } from "@/components/assistant/assistant-comparison";
import { AssistantRecommendationCard } from "@/components/assistant/assistant-recommendation-card";
import type { AssistantChatMessage } from "@/types/assistant";

export function AssistantMessage({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === "user";
  const className = isUser ? "message user" : "message";

  if (message.content.type === "text") {
    return (
      <div
        className={className}
        role="article"
        aria-label={isUser ? "Your message" : "Assistant message"}
      >
        <p className="m-0 whitespace-pre-wrap">{message.content.text}</p>
      </div>
    );
  }

  if (message.content.type === "error") {
    return (
      <div className="message assistant-error" role="alert">
        <p className="eyebrow mb-2">Something went wrong</p>
        <p className="m-0 text-sm">{message.content.message}</p>
      </div>
    );
  }

  if (message.content.type === "recommendations") {
    return (
      <div className={className} role="article" aria-label="Assistant recommendations">
        <p className="m-0 text-sm leading-7 whitespace-pre-wrap">{message.content.intro}</p>
        <div className="grid gap-3 mt-4">
          {message.content.products.map((p) => (
            <AssistantRecommendationCard key={p.productId} product={p} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-6 mt-4 m-0">
          {message.content.explanation}
        </p>
      </div>
    );
  }

  return (
    <div className={className} role="article" aria-label="Product comparison">
      <AssistantComparison products={message.content.products} summary={message.content.summary} />
    </div>
  );
}
