"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ObjectNodeData, TaskNodeData } from "@/components/graph/graph-model";
import { cn } from "@/lib/utils";

export interface GraphActions {
  mode: "before" | "after";
  /** Task groups that can still be added from the anchor's menu. */
  available: { key: string; name: string; runs: number }[];
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  add: (key: string) => void;
  addAll: () => void;
  cycle: (key: string, delta: number) => void;
  jump: (key: string, index: number) => void;
}

export const GraphActionsContext = createContext<GraphActions | null>(null);

const useActions = () => {
  const actions = useContext(GraphActionsContext);
  if (!actions) throw new Error("Graph nodes must be rendered inside GraphActionsContext");
  return actions;
};

const short = (id: string) => (id.length > 14 ? `${id.slice(0, 13)}…` : id);

/** Invisible connection points; edges attach left (in) and right (out). */
function Ports() {
  return (
    <>
      <Handle type="target" position={Position.Left} className="rg-port" isConnectable={false} />
      <Handle type="source" position={Position.Right} className="rg-port" isConnectable={false} />
    </>
  );
}

export function ObjectNode({ data }: NodeProps<Node<ObjectNodeData>>) {
  const actions = useActions();
  const showMenu = data.isAnchor && actions.mode === "after";

  return (
    <div className={cn("rg-object", data.isAnchor && "rg-object--anchor")}>
      <Ports />
      <p className="rg-object__label" title={data.label}>
        {data.label}
      </p>
      <p className="rg-id">{short(data.id)}</p>
      {showMenu && <AnchorMenu />}
    </div>
  );
}

/** The "+" at the end of the busy object: pick which task groups to draw. */
function AnchorMenu() {
  const { available, menuOpen, setMenuOpen, add, addAll } = useActions();
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape or a click anywhere else.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as globalThis.Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, setMenuOpen]);

  if (available.length === 0) return null;

  return (
    <div ref={ref} className="rg-menu nodrag nopan">
      <button
        type="button"
        className="rg-plus focus-ring"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Add tasks that use this object"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {!menuOpen && <span className="rg-plus__ping" aria-hidden="true" />}
      </button>

      {menuOpen && (
        <div role="menu" className="rg-menu__list">
          <p className="rg-menu__title">Tasks that use this object</p>
          {available.map((task) => (
            <button
              key={task.key}
              type="button"
              role="menuitem"
              className="rg-menu__item focus-ring"
              onClick={() => add(task.key)}
            >
              <span className="truncate">{task.name}</span>
              <span className="rg-menu__count">{task.runs} runs</span>
            </button>
          ))}
          {available.length > 1 && (
            <button
              type="button"
              role="menuitem"
              className="rg-menu__item rg-menu__item--all focus-ring"
              onClick={addAll}
            >
              Add all {available.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskNode({ data }: NodeProps<Node<TaskNodeData>>) {
  const { cycle, jump } = useActions();
  const group = data.group;

  return (
    <div
      className={cn(
        "rg-task",
        group && "rg-task--group",
        data.status === "failed" && "rg-task--failed"
      )}
    >
      <Ports />
      <p className="rg-task__label" title={data.label}>
        {data.label}
      </p>
      <p className="rg-id">
        {short(data.runId)}
        {data.status === "failed" && <span className="rg-task__failed"> failed</span>}
      </p>

      {group && (
        <div className="rg-task__runs nodrag nopan">
          <div className="rg-cycle">
            <button
              type="button"
              className="rg-cycle__button focus-ring"
              aria-label={`Previous run of ${data.label}`}
              onClick={() => cycle(group.key, -1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="rg-cycle__count" aria-live="polite">
              {group.index + 1} / {group.statuses.length}
            </span>
            <button
              type="button"
              className="rg-cycle__button focus-ring"
              aria-label={`Next run of ${data.label}`}
              onClick={() => cycle(group.key, 1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="rg-statuses" aria-hidden="true">
            {group.statuses.map((status, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                className={cn(
                  "rg-status",
                  status === "failed" && "rg-status--failed",
                  i === group.index && "rg-status--current"
                )}
                onClick={() => jump(group.key, i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
