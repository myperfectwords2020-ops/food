"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function AccountNotificationsList({
  initial,
}: {
  initial: { items: Item[]; total: number };
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial.items);

  const markRead = async (id: string) => {
    await markNotificationReadAction(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    router.refresh();
  };

  const markAll = async () => {
    await markAllNotificationsReadAction();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    router.refresh();
  };

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No notifications yet.</p>;
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className={`panel text-sm ${n.read ? "opacity-80" : "border-primary/30"}`}>
            <div className="flex justify-between gap-2 mb-1">
              <strong>{n.title}</strong>
              <time className="text-xs text-muted-foreground" dateTime={n.createdAt}>
                {new Date(n.createdAt).toLocaleString()}
              </time>
            </div>
            <p className="m-0 leading-7 whitespace-pre-wrap">{n.body}</p>
            {!n.read ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => void markRead(n.id)}
              >
                Mark read
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
