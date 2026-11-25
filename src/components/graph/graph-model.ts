import { Graph, layout } from "@dagrejs/dagre";

/**
 * Mock lineage data and the two ways of drawing it.
 *
 * The data is generic and invented: one busy shared object that many task
 * types consume, each task type run many times with its own input in and
 * output out. No names or ids come from any real system.
 *
 * - `buildBefore` draws every run as its own node, the way the graph used to.
 * - `buildAfter` groups runs of a task type into one node that cycles through
 *   its runs, and only draws the task groups the visitor has asked for.
 */

export type RunStatus = "ok" | "failed";

export interface DataObject {
  kind: string;
  id: string;
}

export interface Run {
  id: string;
  status: RunStatus;
  /** Inputs besides the anchor object. */
  inputs: DataObject[];
  outputs: DataObject[];
}

export interface TaskType {
  key: string;
  name: string;
  runs: Run[];
}

// ---- Readable, deterministic ids ------------------------------------------------

const counters: Record<string, number> = {};
const nextId = (prefix: string) => {
  counters[prefix] = (counters[prefix] ?? 0) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(2, "0")}`;
};

const obj = (kind: string, prefix: string): DataObject => ({ kind, id: nextId(prefix) });

// ---- The mock pipeline -------------------------------------------------------

export const upstream = {
  inputs: [obj("TaskInput", "input"), obj("TaskInput", "input")],
  task: { name: "SourceTaskRun", id: nextId("run") },
  anchor: obj("SharedObject", "shared"),
};

/**
 * A task type "TaskRun X": `count` runs, each with its own "TaskInput X"
 * (unless `hasInput` is false) and one or more "TaskOutput X". Failed runs
 * produce no output.
 */
function taskType(
  letter: string,
  count: number,
  hasInput: boolean,
  outputsPerRun: (i: number) => number = () => 1,
  failed: number[] = []
): TaskType {
  const tag = letter.toLowerCase();
  return {
    key: tag,
    name: `TaskRun ${letter}`,
    runs: Array.from({ length: count }, (_, i) => ({
      id: nextId(`run-${tag}`),
      status: failed.includes(i) ? "failed" : "ok",
      inputs: hasInput ? [obj(`TaskInput ${letter}`, `input-${tag}`)] : [],
      outputs: failed.includes(i)
        ? []
        : Array.from({ length: outputsPerRun(i) }, () =>
            obj(`TaskOutput ${letter}`, `output-${tag}`)
          ),
    })),
  };
}

/** Everything that consumes the anchor object. */
export const taskTypes: TaskType[] = [
  taskType("A", 9, true, undefined, [4]),
  taskType("B", 6, true, undefined, [2]),
  taskType("C", 4, true),
  taskType("D", 3, false, (i) => 2 + (i % 2)),
  taskType("E", 2, true),
];

export const totalRuns = taskTypes.reduce((n, t) => n + t.runs.length, 0);

// ---- Graph building -----------------------------------------------------------

export type ObjectNodeData = {
  kind: "object";
  label: string;
  id: string;
  /** The anchor shows the "+" menu for adding task groups. */
  isAnchor?: boolean;
};

export type TaskNodeData = {
  kind: "task";
  label: string;
  runId: string;
  /** Present on grouped task nodes. */
  group?: { key: string; index: number; statuses: RunStatus[] };
  status: RunStatus;
};

export type GraphNodeData = ObjectNodeData | TaskNodeData;

export interface PlainNode {
  id: string;
  type: "object" | "task";
  data: GraphNodeData;
  width: number;
  height: number;
}

export interface PlainEdge {
  id: string;
  source: string;
  target: string;
}

export const SIZE = {
  object: { width: 190, height: 52 },
  task: { width: 240, height: 74 },
  group: { width: 240, height: 108 },
};

function objectNode(o: DataObject, isAnchor = false): PlainNode {
  return {
    id: `o-${o.id}`,
    type: "object",
    data: { kind: "object", label: o.kind, id: o.id, isAnchor },
    ...SIZE.object,
  };
}

function base() {
  const nodes: PlainNode[] = [
    ...upstream.inputs.map((o) => objectNode(o)),
    {
      id: `t-${upstream.task.id}`,
      type: "task",
      data: { kind: "task", label: upstream.task.name, runId: upstream.task.id, status: "ok" },
      ...SIZE.task,
    },
    objectNode(upstream.anchor, true),
  ];
  const edges: PlainEdge[] = [
    ...upstream.inputs.map((o) => edge(`o-${o.id}`, `t-${upstream.task.id}`)),
    edge(`t-${upstream.task.id}`, `o-${upstream.anchor.id}`),
  ];
  return { nodes, edges };
}

const edge = (source: string, target: string): PlainEdge => ({
  id: `${source}->${target}`,
  source,
  target,
});

/** The old graph: every run, every input and every output, all at once. */
export function buildBefore() {
  const { nodes, edges } = base();
  const anchorId = `o-${upstream.anchor.id}`;
  for (const type of taskTypes) {
    for (const run of type.runs) {
      const taskId = `t-${run.id}`;
      nodes.push({
        id: taskId,
        type: "task",
        data: { kind: "task", label: type.name, runId: run.id, status: run.status },
        ...SIZE.task,
      });
      edges.push(edge(anchorId, taskId));
      for (const input of run.inputs) {
        nodes.push(objectNode(input));
        edges.push(edge(`o-${input.id}`, taskId));
      }
      for (const output of run.outputs) {
        nodes.push(objectNode(output));
        edges.push(edge(taskId, `o-${output.id}`));
      }
    }
  }
  return { nodes, edges };
}

/**
 * The new graph: the path into the anchor, then one grouped node per task
 * type the visitor added, showing the inputs and outputs of the run it is
 * currently on.
 */
export function buildAfter(expanded: string[], runIndex: Record<string, number>) {
  const { nodes, edges } = base();
  const anchorId = `o-${upstream.anchor.id}`;
  for (const key of expanded) {
    const type = taskTypes.find((t) => t.key === key);
    if (!type) continue;
    const index = runIndex[key] ?? 0;
    const run = type.runs[index];
    const taskId = `g-${key}`;
    nodes.push({
      id: taskId,
      type: "task",
      data: {
        kind: "task",
        label: type.name,
        runId: run.id,
        status: run.status,
        group: { key, index, statuses: type.runs.map((r) => r.status) },
      },
      ...SIZE.group,
    });
    edges.push(edge(anchorId, taskId));
    for (const input of run.inputs) {
      nodes.push(objectNode(input));
      edges.push(edge(`o-${input.id}`, taskId));
    }
    for (const output of run.outputs) {
      nodes.push(objectNode(output));
      edges.push(edge(taskId, `o-${output.id}`));
    }
  }
  return { nodes, edges };
}

/** Left-to-right layered layout, the same approach as the production graph. */
export function layoutGraph(nodes: PlainNode[], edges: PlainEdge[]) {
  const g = new Graph();
  g.setGraph({ rankdir: "LR", nodesep: 22, ranksep: 64, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: n.width, height: n.height });
  for (const e of edges) g.setEdge(e.source, e.target);
  layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - n.width / 2, y: p.y - n.height / 2 } };
  });
}
