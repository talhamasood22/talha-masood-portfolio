"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  METRICS,
  MODELS,
  TASKS,
  type Metric,
  type ModelId,
  type Score,
} from "@/data/cad-results";

/* Identity is carried by shape as well as colour, so the chart still reads
   for colour-blind visitors and in print. */
const SERIES: Record<ModelId, { color: string; shape: string }> = {
  qwen: { color: "var(--series-1)", shape: "rounded-full" },
  llama: { color: "var(--series-2)", shape: "rounded-[2px]" },
  gemma: { color: "var(--series-3)", shape: "rotate-45 rounded-[2px] scale-[0.85]" },
};

const AGENTS: Metric["agent"][] = ["Reasoning", "Generation", "Feedback"];
const TICKS = [0, 0.25, 0.5, 0.75, 1];

/** Exactly as the slides print it: 0.8, 0.217, 4/10. Never re-rounded. */
function fmt(score: Score, decimals?: number) {
  if (score.count) return `${score.count.correct}/${score.count.total}`;
  return decimals ? score.value.toFixed(decimals) : String(Number(score.value.toFixed(3)));
}

const MODEL_NAME = new RegExp(`(${MODELS.map((m) => m.name.replace(/[.]/g, "\\.")).join("|")})`);

/** Keeps full model names on one line, so "Llama-3.1-8B-" never ends a line. */
function Names({ text }: { text: string }) {
  return (
    <>
      {text.split(MODEL_NAME).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="whitespace-nowrap">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function Marker({ model, className }: { model: ModelId; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block h-2.5 w-2.5 shrink-0", SERIES[model].shape, className)}
      style={{ backgroundColor: SERIES[model].color }}
    />
  );
}

/** The best score in a row; ties all count as best. */
function bestModels(metric: Metric, row: Record<ModelId, Score>): ModelId[] {
  const values = MODELS.map((m) => row[m.id].value);
  const target = metric.better === "higher" ? Math.max(...values) : Math.min(...values);
  return MODELS.filter((m) => row[m.id].value === target).map((m) => m.id);
}

function Stat({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div className="border-t border-hairline pt-4">
      <p className="font-heading text-[clamp(1.75rem,1.4rem+1.2vw,2.25rem)] leading-none text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-small font-medium text-ink">
        <Names text={label} />
      </p>
      <p className="mt-1 text-small text-muted">
        <Names text={detail} />
      </p>
    </div>
  );
}

function DotPlot({ metric }: { metric: Metric }) {
  return (
    <div className="mt-6" aria-hidden="true">
      {TASKS.map((task) => {
        const row = metric.data[task.id];
        const best = bestModels(metric, row);
        return (
          <div
            key={task.id}
            className="grid grid-cols-1 gap-1 border-t border-hairline py-3 sm:grid-cols-[9.5rem_1fr] sm:items-center sm:gap-4"
          >
            <p className="text-small leading-tight">
              <span className="font-medium text-ink">{task.name}</span>
              <span className="meta ml-2 sm:ml-0 sm:block">{task.level}</span>
            </p>

            <div className="relative h-14">
              {TICKS.map((t) => (
                <span
                  key={t}
                  className="absolute inset-y-0 w-px bg-hairline"
                  style={{ left: `${t * 100}%` }}
                />
              ))}
              {MODELS.map((model, lane) => {
                const score = row[model.id];
                // Label the best score once per row; a row where everyone scored 0 gets none.
                const isBest = best[0] === model.id && !(metric.better === "higher" && score.value === 0);
                const nearEnd = score.value > 0.8;
                return (
                  <div
                    key={model.id}
                    className="absolute inset-x-0 h-0"
                    style={{ top: `${20 + lane * 30}%` }}
                  >
                    {/* stem from zero, so the length reads as magnitude */}
                    <span
                      className="absolute top-0 h-0.5 -translate-y-1/2 rounded-full opacity-35"
                      style={{
                        width: `${score.value * 100}%`,
                        backgroundColor: SERIES[model.id].color,
                      }}
                    />
                    <span
                      className="group absolute top-0 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      style={{ left: `${score.value * 100}%` }}
                    >
                      <Marker
                        model={model.id}
                        className="shadow-[0_0_0_2px_var(--panel)] transition-transform group-hover:scale-125"
                      />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-hairline bg-panel-raised px-2 py-1 text-[0.75rem] text-ink shadow-sm group-hover:block">
                        {model.name}, {task.name}: {fmt(score, metric.decimals)}
                      </span>
                    </span>
                    {isBest && (
                      <span
                        className={cn(
                          "absolute top-0 -translate-y-1/2 whitespace-nowrap text-[0.75rem] font-medium leading-none text-ink tabular-nums",
                          nearEnd ? "-translate-x-full pr-3.5" : "pl-3.5"
                        )}
                        style={{ left: `${score.value * 100}%` }}
                      >
                        {fmt(score, metric.decimals)}
                        {best.length > 1 && <span className="text-faint"> tie</span>}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-1 border-t border-hairline-strong pt-2 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
        <span className="hidden sm:block" />
        <div className="relative h-4">
          {TICKS.map((t) => (
            <span
              key={t}
              className={cn(
                "meta absolute top-0",
                t === 0 ? "" : t === 1 ? "-translate-x-full" : "-translate-x-1/2"
              )}
              style={{ left: `${t * 100}%` }}
            >
              {t === 0 || t === 1 ? t : t.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataTable({ metric }: { metric: Metric }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[22rem] text-left text-small">
        <caption className="sr-only">
          {metric.label} by part and model ({metric.better} is better)
        </caption>
        <thead>
          <tr className="border-b border-hairline-strong">
            <th scope="col" className="py-2 pr-4 font-medium text-ink">Part</th>
            {MODELS.map((m) => (
              <th key={m.id} scope="col" className="py-2 pr-4 font-medium text-ink">
                {m.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TASKS.map((task) => {
            const row = metric.data[task.id];
            const best = bestModels(metric, row);
            return (
              <tr key={task.id} className="border-b border-hairline">
                <th scope="row" className="py-2 pr-4 font-normal text-muted">
                  {task.name} <span className="text-faint">({task.level.toLowerCase()})</span>
                </th>
                {MODELS.map((m) => (
                  <td
                    key={m.id}
                    className={cn(
                      "py-2 pr-4 tabular-nums",
                      best.includes(m.id) ? "font-semibold text-ink" : "text-muted"
                    )}
                  >
                    {fmt(row[m.id], metric.decimals)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The evaluation results of the multi-agent CAD project: three headline
 * numbers, then one chart per metric, grouped by the agent it measures.
 */
export function CadResults() {
  const [metricId, setMetricId] = useState(METRICS[0].id);
  const metric = METRICS.find((m) => m.id === metricId) ?? METRICS[0];

  return (
    <section aria-labelledby="cad-results-heading" className="border-t border-hairline pt-8 md:col-span-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h4 id="cad-results-heading" className="text-h3 font-semibold text-ink">
          How the models did
        </h4>
        <p className="meta">
          5 parts · 10 runs per model · one agent swapped at a time, the other two on{" "}
          <span className="whitespace-nowrap">Gemma-2-9B-it</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <Stat
          value="5 of 5"
          label="parts where Qwen2.5-Coder-7B-Instruct understood the prompt best"
          detail="It extracted 0.67–0.90 of the requirements. Llama-3.1-8B-Instruct and Gemma-2-9B-it never got above 0.47."
        />
        <Stat
          value="0.046"
          label="Qwen2.5-Coder-7B-Instruct's average shape error"
          detail="Against 0.130 for Gemma-2-9B-it and 0.310 for Llama-3.1-8B-Instruct (normalized point-cloud distance, lower is better)."
        />
        <Stat
          value="0 of 36"
          label="correct feedback verdicts on medium and hard parts"
          detail="Across all three models. The feedback loop is the part that needs work next."
        />
      </div>

      <div className="mt-10 space-y-3" role="group" aria-label="Choose a metric">
        {AGENTS.map((agent) => (
          <div key={agent} className="flex flex-wrap items-center gap-2">
            <span className="meta w-full sm:w-36">{agent} agent</span>
            {METRICS.filter((m) => m.agent === agent).map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={m.id === metric.id}
                onClick={() => setMetricId(m.id)}
                className={cn(
                  "focus-ring min-h-[44px] rounded-chip border px-3 text-small transition-colors",
                  m.id === metric.id
                    ? "border-accent bg-accent text-on-accent"
                    : "border-hairline-strong text-muted hover:border-accent hover:text-ink"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-8" aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="max-w-[60ch] text-small text-muted">
            <span className="font-medium text-ink">{metric.label}.</span>{" "}
            {metric.definition}{" "}
            <span className="text-ink">
              {metric.better === "higher" ? "Higher is better." : "Lower is better."}
            </span>
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
            {MODELS.map((m) => (
              <li key={m.id} className="flex items-center gap-1.5 text-small text-muted">
                <Marker model={m.id} />
                {m.name}
              </li>
            ))}
          </ul>
        </div>

        <DotPlot metric={metric} />

        <p className="mt-5 max-w-[70ch] text-base text-ink text-pretty">
          <Names text={metric.finding} />
        </p>

        <details className="mt-4">
          <summary className="focus-ring inline-flex min-h-[44px] cursor-pointer items-center rounded-chip text-small font-medium text-accent">
            View as a table
          </summary>
          <DataTable metric={metric} />
        </details>
      </div>
    </section>
  );
}
