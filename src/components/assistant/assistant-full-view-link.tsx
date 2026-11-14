"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useAssistantShell } from "@/components/assistant/assistant-context";

type Props = {
  className?: string;
  children: ReactNode;
};

export function AssistantFullViewLink({ className, children }: Props) {
  const { closePanel } = useAssistantShell();
  const router = useRouter();

  return (
    <Link
      href="/assistant"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        closePanel();
        router.push("/assistant");
      }}
    >
      {children}
    </Link>
  );
}
