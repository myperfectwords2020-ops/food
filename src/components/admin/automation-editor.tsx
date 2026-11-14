"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  publishAutomationAction,
  saveAutomationAction,
  toggleAutomationAction,
} from "@/app/actions/admin";
import { WorkflowBuilder } from "@/components/admin/workflow-builder";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button } from "@/components/ui/button";
import type { AdminAutomation } from "@/types/admin";

export function AutomationEditor({
  automation,
  mode,
}: {
  automation?: AdminAutomation | null | undefined;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const nodesRef = useRef(automation?.nodes ?? []);
  const [name, setName] = useState(automation?.name ?? "");
  const [description, setDescription] = useState(automation?.description ?? "");
  const [trigger, setTrigger] = useState(automation?.trigger ?? "cart.abandoned");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = async (asDraft: boolean) => {
    setMessage(null);
    if (!name.trim() || !trigger.trim()) {
      toast.error("Name and trigger are required.");
      return;
    }
    if (nodesRef.current.length < 2) {
      toast.error("Workflow must include at least a trigger and end step.");
      return;
    }
    const result = await saveAutomationAction({
      id: automation?.id,
      name,
      description,
      trigger,
      nodesJson: JSON.stringify(nodesRef.current),
      asDraft,
    });
    if (!result.ok) {
      setMessage(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(asDraft ? "Draft saved" : "Automation saved");
    setDirty(false);
    if (mode === "create") router.push(`/admin/automations/${result.id}`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {dirty ? (
        <p className="text-xs text-muted-foreground" role="status">
          Unsaved workflow changes
        </p>
      ) : null}
      <div className="form-grid max-w-xl">
        <label className="field full" htmlFor="auto-name">
          <span>Name</span>
          <input
            id="auto-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <label className="field full" htmlFor="auto-desc">
          <span>Description</span>
          <textarea
            id="auto-desc"
            rows={2}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <label className="field full" htmlFor="auto-trigger">
          <span>Trigger (server event)</span>
          <input
            id="auto-trigger"
            value={trigger}
            onChange={(e) => {
              setTrigger(e.target.value);
              setDirty(true);
            }}
          />
        </label>
      </div>
      <WorkflowBuilder
        initialNodes={automation?.nodes ?? []}
        onChange={(nodes) => {
          nodesRef.current = nodes;
          setDirty(true);
        }}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Button type="button" onClick={() => save(true)}>
          Save draft
        </Button>
        <Button type="button" variant="outline" onClick={() => save(false)}>
          Save
        </Button>
        {automation ? (
          <>
            <ConfirmActionButton
              label="Publish"
              confirmMessage="Enable this automation on the server when workers are connected?"
              onConfirm={async () => {
                await publishAutomationAction(automation.id);
                toast.success("Published (mock enable)");
                router.refresh();
              }}
            />
            <ConfirmActionButton
              label={automation.status === "enabled" ? "Disable" : "Enable"}
              confirmMessage={`${automation.status === "enabled" ? "Disable" : "Enable"} this automation?`}
              onConfirm={async () => {
                await toggleAutomationAction(automation.id, automation.status !== "enabled");
                toast.success("Status updated (mock)");
                router.refresh();
              }}
            />
          </>
        ) : null}
      </div>
      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
