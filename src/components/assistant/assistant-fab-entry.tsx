"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { useAssistantShell } from "@/components/assistant/assistant-context";

export function AssistantFabEntry() {
  const { openPanel } = useAssistantShell();

  return (
    <>
      <button
        type="button"
        className="assistant-fab"
        aria-label="Open shopping assistant"
        onClick={openPanel}
      >
        <Sparkles size={18} />
        <span>Ask AI</span>
      </button>
      <Link href="/assistant" className="sr-only">
        Open full shopping assistant page
      </Link>
    </>
  );
}
