"use client";

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Panel,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import {
  buildAfter,
  buildBefore,
  layoutGraph,
  taskTypes,
  type GraphNodeData,
} from "@/components/graph/graph-model";
import {
  GraphActionsContext,
  ObjectNode,
  TaskNode,
  type GraphActions,
} from "@/components/graph/GraphNodes";
import { cn } from "@/lib/utils";

const nodeTypes: NodeTypes = { object: ObjectNode, task: TaskNode };

/** Breathing room between the graph and the canvas edge when it is framed. */
const FIT_PADDING = "48px";
/** Phones have little width to spare, so the frame is tighter there, except
 *  at the top, which keeps clear of the caption pill in the corner. */
const FIT_PADDING_NARROW = { top: "52px", right: "16px", bottom: "16px", left: "16px" } as const;

/** Below this the node labels stop being readable on a phone. */
const NARROW_MIN_ZOOM = 0.45;

const NARROW_QUERY = "(max-width: 639px)";
const subscribeNarrow = (onChange: () => void) => {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isNarrow = () => window.matchMedia(NARROW_QUERY).matches;

type Mode = "before" | "after";

const noopSubscribe = () => () => {};

/**
 * A working, mock-data rebuild of the relationship graph redesign.
 *
 * "Before" draws every run of every task as its own node. "After" groups runs
 * by task type, lets you cycle through a group's runs with ‹ › (which swaps
 * its inputs and outputs and re-lays the graph out), and only draws the task
 * groups you add from the "+" on the busy object.
 */
export function RelationshipGraph({ caption }: { caption: string }) {
  // React Flow measures the DOM, so the canvas renders on the client only;
  // the server sends a placeholder of the same size.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  return (
    <div className="rg">
      {mounted ? (
        <ReactFlowProvider>
          <GraphCanvas caption={caption} />
        </ReactFlowProvider>
      ) : (
        <div className="rg-canvas" aria-hidden="true" />
      )}
    </div>
  );
}

function GraphCanvas({ caption }: { caption: string }) {
  const [mode, setMode] = useState<Mode>("after");
  const [expanded, setExpanded] = useState<string[]>(["a"]);
  const [runIndex, setRunIndex] = useState<Record<string, number>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  // Bumped by Reset: forces a fresh layout (undoing any dragged nodes) and a
  // re-frame, in either view.
  const [resetCount, setResetCount] = useState(0);
  const { fitView } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  // On a phone the grouped graph is laid out top to bottom: its ranks are
  // too wide to fit side by side at a readable size, but stacked they fit
  // the whole canvas. "Before" keeps its left-to-right wall of nodes.
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow, () => false);
  const vertical = narrow && mode === "after";

  const graph = useMemo(() => {
    const { nodes, edges } =
      mode === "before" ? buildBefore() : buildAfter(expanded, runIndex);
    const placed = layoutGraph(nodes, edges, vertical ? "TB" : "LR");
    return {
      nodes: placed.map(
        (n): Node<GraphNodeData> => ({
          id: n.id,
          type: n.type,
          data: n.data,
          position: n.position,
          width: n.width,
          height: n.height,
          // Draggable nodes also receive pointer events, which the "+" menu
          // and the run arrows inside them depend on.
          draggable: true,
          selectable: false,
          // Keep the open menu above the nodes laid out to its right.
          zIndex: n.data.kind === "object" && n.data.isAnchor ? 10 : 0,
        })
      ),
      edges: edges.map(
        (e): Edge => ({
          id: e.id,
          source: e.source,
          target: e.target,
          className: "rg-edge",
        })
      ),
    };
    // resetCount only forces a fresh layout object; it does not change it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, expanded, runIndex, resetCount, vertical]);

  // The laid-out nodes seed React Flow's own node state, so visitors can drag
  // nodes around; any change to the graph lays it out afresh.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>(graph.nodes);
  useEffect(() => {
    setNodes(graph.nodes);
  }, [graph.nodes, setNodes]);

  // Handles move between the sides and the top and bottom when the layout
  // direction flips, so React Flow has to re-measure where edges attach.
  useEffect(() => {
    updateNodeInternals(graph.nodes.map((n) => n.id));
    // Only on a direction change; new nodes are measured as they mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical, updateNodeInternals]);

  // Frame the graph whenever its shape changes (not when a run is cycled,
  // so the view does not jump while you step through runs). The starting
  // graph always fits whole. On a phone, once several groups are added the
  // zoom stops at a still-legible floor and you pan for the rest; "Before"
  // always fits everything, as the wall of nodes is the point.
  const shapeKey = `${mode}:${expanded.join(",")}:${resetCount}:${vertical}`;
  useEffect(() => {
    const id = window.setTimeout(() => {
      fitView({
        padding: narrow ? FIT_PADDING_NARROW : FIT_PADDING,
        duration: 450,
        maxZoom: 1,
        minZoom: vertical ? NARROW_MIN_ZOOM : undefined,
      });
    }, 40);
    return () => window.clearTimeout(id);
  }, [shapeKey, narrow, vertical, fitView]);

  const actions = useMemo<GraphActions>(
    () => ({
      mode,
      vertical,
      available: taskTypes
        .filter((t) => !expanded.includes(t.key))
        .map((t) => ({ key: t.key, name: t.name, runs: t.runs.length })),
      menuOpen,
      setMenuOpen,
      add: (key) => {
        setExpanded((list) => (list.includes(key) ? list : [...list, key]));
        setMenuOpen(false);
      },
      addAll: () => {
        setExpanded(taskTypes.map((t) => t.key));
        setMenuOpen(false);
      },
      cycle: (key, delta) => {
        const runs = taskTypes.find((t) => t.key === key)?.runs.length ?? 1;
        setRunIndex((map) => ({ ...map, [key]: ((map[key] ?? 0) + delta + runs) % runs }));
      },
      jump: (key, index) => setRunIndex((map) => ({ ...map, [key]: index })),
    }),
    [mode, vertical, expanded, menuOpen]
  );

  // Back to the starting state: in After, only TaskRun A on its first run;
  // in both views, a fresh layout and a re-frame.
  const reset = useCallback(() => {
    setExpanded(["a"]);
    setRunIndex({});
    setMenuOpen(false);
    setResetCount((n) => n + 1);
  }, []);

  return (
    <>
      <div className="rg-toolbar">
        <div className="rg-toggle" role="group" aria-label="Graph version">
          {(["before", "after"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setMenuOpen(false);
              }}
              className={cn("rg-toggle__button focus-ring", mode === m && "is-active")}
            >
              {m === "before" ? "Before" : "After"}
            </button>
          ))}
        </div>

        <dl className="rg-stats" aria-live="polite">
          <div>
            <dt>Nodes</dt>
            <dd>{graph.nodes.length}</dd>
          </div>
          <div>
            <dt>Edges</dt>
            <dd>{graph.edges.length}</dd>
          </div>
        </dl>

        <button type="button" onClick={reset} className="rg-reset focus-ring">
          Reset
        </button>
      </div>

      {/* Above the canvas, so you know what to do before you look at it. */}
      <p className="rg-hint" aria-live="polite">
        {mode === "before"
          ? "Every run is its own node, so the busy object fans out into a wall of tasks. Zoomed to fit, nothing is readable."
          : "Use + on SharedObject to add a task group, and ‹ › to step through a group's runs. Drag nodes to move them, or the background to pan."}
      </p>

      <GraphActionsContext.Provider value={actions}>
        <div
          className="rg-canvas"
          role="region"
          aria-label={
            mode === "before"
              ? "Task-run graph before the redesign: every task run drawn separately"
              : "Task-run graph after the redesign: task runs grouped by type"
          }
        >
          <ReactFlow
            nodes={nodes}
            edges={graph.edges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable={false}
            // Let the page scroll over the canvas; zoom with the buttons or a pinch.
            zoomOnScroll={false}
            preventScrolling={false}
            zoomOnDoubleClick={false}
            minZoom={0.08}
            maxZoom={1.6}
            fitView
            fitViewOptions={{ padding: FIT_PADDING, maxZoom: 1 }}
            attributionPosition="bottom-left"
          >
            <Panel position="top-left" className="rg-caption">
              {caption}
            </Panel>
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </div>
      </GraphActionsContext.Provider>
    </>
  );
}
