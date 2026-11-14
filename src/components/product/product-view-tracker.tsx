"use client";

import { useEffect, useRef } from "react";

import { recordProductViewAction } from "@/app/actions/analytics-events";

const SESSION_KEY = "elanskin_analytics_session";

function getOrCreateSessionKey() {
  if (typeof window === "undefined") return undefined;
  let key = window.localStorage.getItem(SESSION_KEY);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, key);
  }
  return key;
}

export function ProductViewTracker({ productId }: { productId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const sessionKey = getOrCreateSessionKey();
    void recordProductViewAction(
      sessionKey ? { productId, sessionKey } : { productId },
    );
  }, [productId]);

  return null;
}
