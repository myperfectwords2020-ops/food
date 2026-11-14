"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { WorkflowNode, WorkflowNodeType } from "@/types/admin";

const NODE_TYPES: WorkflowNodeType[] = [
  "TRIGGER",
  "CONDITION",
  "ACTION",
  "DELAY",
  "NOTIFICATION",
  "END",
];

const DEFAULT_TITLES: Record<WorkflowNodeType, string> = {
  TRIGGER: "New trigger",
  CONDITION: "Check condition",
  ACTION: "Run action",
  DELAY: "Wait",
  NOTIFICATION: "Send notification",
  END: "End workflow",
};

export function WorkflowBuilder({
  initialNodes,
  onChange,
}: {
  initialNodes: WorkflowNode[];
  onChange?: (nodes: WorkflowNode[]) => void;
}) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(
    initialNodes.length
      ? initialNodes
      : [
          {
            id: "n-trigger",
            type: "TRIGGER",
            title: "Select trigger",
            description: "Server-defined event (e.g. order.paid)",
          },
          { id: "n-end", type: "END", title: "End", description: "Workflow complete" },
        ],
  );

  const update = (next: WorkflowNode[]) => {
    setNodes(next);
    onChange?.(next);
  };

  const addNode = (type: WorkflowNodeType) => {
    const node: WorkflowNode = {
      id: `n-${crypto.randomUUID().slice(0, 6)}`,
      type,
      title: DEFAULT_TITLES[type],
      description: "Configure on save — no arbitrary code execution",
    };
    const endIdx = nodes.findIndex((n) => n.type === "END");
    if (endIdx >= 0) {
      const copy = [...nodes];
      copy.splice(endIdx, 0, node);
      update(copy);
    } else {
      update([...nodes, node]);
    }
  };

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-4">
      <aside className="panel">
        <h2 className="text-sm font-bold mb-3">Add step</h2>
        <div className="grid gap-2">
          {NODE_TYPES.filter((t) => t !== "END").map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addNode(type)}
            >
              <Plus size={14} aria-hidden /> {type}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-6">
          Steps run through approved server actions only. The UI does not execute custom scripts.
        </p>
      </aside>
      <div className="workflow">
        {nodes.map((node, index) => (
          <div key={node.id}>
            <div className="node">
              <small>{node.type}</small>
              <label className="field mt-2 block">
                <span className="sr-only">Title</span>
                <input
                  className="w-full text-sm font-bold"
                  value={node.title}
                  onChange={(e) => {
                    const copy = nodes.map((n) =>
                      n.id === node.id ? { ...n, title: e.target.value } : n,
                    );
                    update(copy);
                  }}
                />
              </label>
              <label className="field mt-2 block">
                <span className="sr-only">Description</span>
                <textarea
                  className="w-full text-xs min-h-[60px]"
                  value={node.description}
                  onChange={(e) => {
                    const copy = nodes.map((n) =>
                      n.id === node.id ? { ...n, description: e.target.value } : n,
                    );
                    update(copy);
                  }}
                />
              </label>
              {node.type !== "TRIGGER" && node.type !== "END" ? (
                <Button
                  type="button"
                  variant="icon"
                  className="mt-2"
                  aria-label={`Remove ${node.title}`}
                  onClick={() => update(nodes.filter((n) => n.id !== node.id))}
                >
                  <Trash2 size={14} />
                </Button>
              ) : null}
            </div>
            {index < nodes.length - 1 ? <div className="connector" aria-hidden /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
