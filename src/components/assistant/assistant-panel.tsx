"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { useAssistantShell } from "@/components/assistant/assistant-context";
import { AssistantFullViewLink } from "@/components/assistant/assistant-full-view-link";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { Button } from "@/components/ui/button";

type Props = {
  customerName?: string | undefined;
  dietaryHint?: string | undefined;
  recentFocus?: string | undefined;
};

export function AssistantPanel({ customerName, dietaryHint, recentFocus }: Props) {
  const { panelOpen, closePanel } = useAssistantShell();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  return (
    <div className="assistant-panel-root" role="presentation">
      <button
        type="button"
        className="assistant-panel-backdrop"
        aria-label="Close assistant"
        onClick={closePanel}
      />
      <div
        className="assistant-panel-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping assistant"
      >
        <div className="assistant-panel-head">
          <p className="eyebrow m-0">Shopping assistant</p>
          <div className="flex items-center gap-2">
            <AssistantFullViewLink className="assistant-full-view-link hidden sm:inline-flex">
              Full page
            </AssistantFullViewLink>
            <Button
              ref={closeRef}
              type="button"
              variant="icon"
              aria-label="Close"
              onClick={closePanel}
            >
              <X />
            </Button>
          </div>
        </div>
        <AssistantChat
          mode="panel"
          customerName={customerName}
          dietaryHint={dietaryHint}
          recentFocus={recentFocus}
        />
      </div>
    </div>
  );
}
