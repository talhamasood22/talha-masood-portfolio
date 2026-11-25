"use client";

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Panel,
  useNodesState,
  useReactFlow,
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

  const graph = useMemo(() => {
    const { nodes, edges } =
      mode === "before" ? buildBefore() : buildAfter(expanded, runIndex);
    const placed = layoutGraph(nodes, edges);
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
  }, [mode, expanded, runIndex, resetCount]);

  // The laid-out nodes seed React Flow's own node state, so visitors can drag
  // nodes around; any change to the graph lays it out afresh.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>(graph.nodes);
  useEffect(() => {
    setNodes(graph.nodes);
  }, [graph.nodes, setNodes]);

  // Frame the graph whenever its shape changes (not when a run is cycled,
  // so the view does not jump while you step through runs).
  const shapeKey = `${mode}:${expanded.join(",")}:${resetCount}`;
  // On a phone, fitting the whole grouped graph makes it unreadably small,
  // so it opens at a legible zoom around the centre and you pan for the
  // rest. "Before" always fits everything: the wall of nodes is the point.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const narrow = window.matchMedia("(max-width: 639px)").matches;
      fitView({
        padding: FIT_PADDING,
        duration: 450,
        maxZoom: 1,
        minZoom: narrow && mode === "after" ? 0.62 : undefined,
      });
    }, 40);
    return () => window.clearTimeout(id);
  }, [shapeKey, mode, fitView]);

  const actions = useMemo<GraphActions>(
    () => ({
      mode,
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
    [mode, expanded, menuOpen]
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

      <GraphActionsContext.Provider value={actions}>
        <div
          className="rg-canvas"
          role="region"
          aria-label={
            mode === "before"
              ? "Relationship graph before the redesign: every task run drawn separately"
              : "Relationship graph after the redesign: task runs grouped by type"
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
            proOptions={{ hideAttribution: true }}
          >
            <Panel position="top-left" className="rg-caption">
              {caption}
            </Panel>
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </div>
      </GraphActionsContext.Provider>

      <p className="rg-hint">
        {mode === "before"
          ? "Every run is its own node, so the busy object fans out into a wall of tasks. Zoomed to fit, nothing is readable."
          : "Use + on SharedObject to add a task group, and ‹ › to step through a group's runs. Drag nodes to move them, or the background to pan."}
      </p>
    </>
  );
}
