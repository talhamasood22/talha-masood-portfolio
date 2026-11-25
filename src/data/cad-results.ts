/**
 * Results of the multi-agent CAD project, copied from the final presentation
 * (University of Stuttgart practical course, topic 2). Every number here
 * appears in the deck's "Main Results" tables. Keep them in sync with it, not
 * rounded or re-derived.
 *
 * Method: one agent's model is varied at a time (Qwen2.5-Coder-7B-Instruct, Llama-3.1-8B-Instruct or Gemma-2-9B-it) while
 * the other two agents stay on Gemma-2-9B-it, the most stable model in a 30-run
 * pre-experiment. Each configuration ran 10 times per task.
 */

export type ModelId = "qwen" | "llama" | "gemma";
export type TaskId = "box" | "cylinder" | "plate" | "shaft" | "chair";

export const MODELS: { id: ModelId; name: string }[] = [
  { id: "qwen", name: "Qwen2.5-Coder-7B-Instruct" },
  { id: "llama", name: "Llama-3.1-8B-Instruct" },
  { id: "gemma", name: "Gemma-2-9B-it" },
];

export const TASKS: { id: TaskId; name: string; level: "Simple" | "Medium" | "Hard" }[] = [
  { id: "box", name: "Box", level: "Simple" },
  { id: "cylinder", name: "Cylinder", level: "Simple" },
  { id: "plate", name: "Plate with holes", level: "Medium" },
  { id: "shaft", name: "Stepped shaft", level: "Medium" },
  { id: "chair", name: "Chair", level: "Hard" },
];

/** A score from 0 to 1. `count` is set when the slide gives it as k/n. */
export interface Score {
  value: number;
  count?: { correct: number; total: number };
}

type Table = Record<TaskId, Record<ModelId, Score>>;

const v = (value: number): Score => ({ value });
const frac = (correct: number, total: number): Score => ({
  value: total === 0 ? 0 : correct / total,
  count: { correct, total },
});

export interface Metric {
  id: string;
  agent: "Reasoning" | "Generation" | "Feedback";
  label: string;
  /** What the number measures, in one line. */
  definition: string;
  better: "higher" | "lower";
  /** Fixed decimals when the slides print them that way (0.330). */
  decimals?: number;
  /** The finding, in plain words. Every claim must hold for `data`. */
  finding: string;
  data: Table;
}

export const METRICS: Metric[] = [
  {
    id: "requirements",
    agent: "Reasoning",
    label: "Understood the request",
    definition: "Share of the request's requirements the model picked up correctly.",
    better: "higher",
    finding:
      "Qwen2.5-Coder-7B-Instruct understood the most on every part. The other two caught less than half of what was asked.",
    data: {
      box: { qwen: v(0.8), llama: v(0.35), gemma: v(0.2) },
      cylinder: { qwen: v(0.9), llama: v(0.217), gemma: v(0.47) },
      plate: { qwen: v(0.73), llama: v(0.2), gemma: v(0.29) },
      shaft: { qwen: v(0.71), llama: v(0.2), gemma: v(0.218) },
      chair: { qwen: v(0.67), llama: v(0.2), gemma: v(0.069) },
    },
  },
  {
    id: "coverage",
    agent: "Reasoning",
    label: "Features covered",
    definition: "Share of the required CAD features the plan covered.",
    better: "higher",
    finding:
      "Qwen2.5-Coder-7B-Instruct covered every feature on every part. On the chair, Llama-3.1-8B-Instruct covered none and Gemma-2-9B-it 0.57.",
    data: {
      box: { qwen: v(1), llama: v(1), gemma: v(1) },
      cylinder: { qwen: v(1), llama: v(1), gemma: v(1) },
      plate: { qwen: v(1), llama: v(1), gemma: v(1) },
      shaft: { qwen: v(1), llama: v(0.9), gemma: v(0.7) },
      chair: { qwen: v(1), llama: v(0), gemma: v(0.57) },
    },
  },
  {
    id: "compile",
    agent: "Reasoning",
    label: "Code that ran",
    definition: "Share of runs where the generated CAD code ran without errors.",
    better: "higher",
    finding:
      "Every model's code ran every time on the simple box. On the chair, at most 3 runs in 10 worked.",
    data: {
      box: { qwen: v(1), llama: v(1), gemma: v(1) },
      cylinder: { qwen: v(0.8), llama: v(0.6), gemma: v(0.5) },
      plate: { qwen: v(0.9), llama: v(1), gemma: v(1) },
      shaft: { qwen: v(0.4), llama: v(0.1), gemma: v(0.1) },
      chair: { qwen: v(0.1), llama: v(0.3), gemma: v(0.1) },
    },
  },
  {
    id: "pointcloud",
    decimals: 3,
    agent: "Generation",
    label: "Shape error",
    definition: "How far the built part was from the correct one; 0 is a perfect match.",
    better: "lower",
    finding:
      "Qwen2.5-Coder-7B-Instruct's parts were closest on average. On the chair the score stops meaning much: no model built a complete chair.",
    data: {
      box: { qwen: v(0.066), llama: v(0.932), gemma: v(0.056) },
      cylinder: { qwen: v(0.001), llama: v(0.33), gemma: v(0.242) },
      plate: { qwen: v(0.037), llama: v(0.059), gemma: v(0.036) },
      shaft: { qwen: v(0.013), llama: v(0.146), gemma: v(0.125) },
      chair: { qwen: v(0.113), llama: v(0.083), gemma: v(0.193) },
    },
  },
  {
    id: "hausdorff",
    decimals: 3,
    agent: "Generation",
    label: "Worst-case shape error",
    definition: "Normalized average Hausdorff distance: the largest gap between the two shapes.",
    better: "lower",
    finding:
      "Qwen2.5-Coder-7B-Instruct was lowest on three of five parts (cylinder, plate, shaft). Gemma-2-9B-it was lowest on the box, Llama-3.1-8B-Instruct on the chair.",
    data: {
      box: { qwen: v(0.148), llama: v(0.211), gemma: v(0.106) },
      cylinder: { qwen: v(0.006), llama: v(0.503), gemma: v(0.488) },
      plate: { qwen: v(0.119), llama: v(0.144), gemma: v(0.156) },
      shaft: { qwen: v(0.108), llama: v(0.244), gemma: v(0.272) },
      chair: { qwen: v(0.332), llama: v(0.183), gemma: v(0.414) },
    },
  },
  {
    id: "feedback",
    agent: "Feedback",
    label: "Correct verdicts",
    definition: "Share of runs where the feedback agent's pass/fail verdict was right.",
    better: "higher",
    finding:
      "No model judged a single medium or hard run correctly (0 of 36). The agent checked metadata such as the bounding box and volume, not the geometry, which is the clearest next step.",
    data: {
      box: { qwen: frac(4, 10), llama: frac(4, 9), gemma: frac(3, 10) },
      cylinder: { qwen: frac(0, 10), llama: frac(1, 4), gemma: frac(0, 5) },
      plate: { qwen: frac(0, 6), llama: frac(0, 9), gemma: frac(0, 10) },
      shaft: { qwen: frac(0, 2), llama: frac(0, 1), gemma: frac(0, 1) },
      chair: { qwen: frac(0, 4), llama: frac(0, 2), gemma: frac(0, 1) },
    },
  },
];

/** The metrics the page shows; the rest stay here, verified, for reference. */
export const SHOWN_METRIC_IDS = ["requirements", "compile", "pointcloud"] as const;
