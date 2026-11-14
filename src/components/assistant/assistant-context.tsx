"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type AssistantContextValue = {
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const togglePanel = useCallback(() => setPanelOpen((v) => !v), []);

  const value = useMemo(
    () => ({ panelOpen, openPanel, closePanel, togglePanel }),
    [panelOpen, openPanel, closePanel, togglePanel],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistantShell() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistantShell must be used within AssistantProvider");
  return ctx;
}
