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
   for colour-blind visitors and in print. The theme tokens live in
   globals.css; the fallbacks (the dark-theme steps) keep the bars drawn even
   if a stylesheet without them is served. */
const SERIES: Record<ModelId, { color: string; shape: string }> = {
  qwen: { color: "var(--series-1, #3987e5)", shape: "rounded-full" },
  llama: { color: "var(--series-2, #d95926)", shape: "rounded-[2px]" },
  gemma: { color: "var(--series-3, #199e70)", shape: "rotate-45 rounded-[2px] scale-[0.85]" },
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

/** Mean of one metric across the five parts, for one model. */
function meanOf(metricId: string, model: ModelId) {
  const metric = METRICS.find((m) => m.id === metricId)!;
  return TASKS.reduce((sum, t) => sum + metric.data[t.id][model].value, 0) / TASKS.length;
}

/** Feedback verdicts pooled by difficulty: correct / total over all models. */
function verdictsWhere(test: (level: string) => boolean) {
  const metric = METRICS.find((m) => m.id === "feedback")!;
  let correct = 0;
  let total = 0;
  for (const t of TASKS) {
    if (!test(t.level)) continue;
    for (const m of MODELS) {
      correct += metric.data[t.id][m.id].count?.correct ?? 0;
      total += metric.data[t.id][m.id].count?.total ?? 0;
    }
  }
  return { correct, total };
}

interface MiniBar {
  key: string;
  label: string;
  value: number;
  shown: string;
  color: string;
  model?: ModelId;
}

/** A headline number with a tiny bar comparison under it, on a 0–scaleMax scale. */
function Stat({
  value,
  label,
  bars,
  note,
  scaleMax = 1,
}: {
  value: string;
  label: string;
  bars: MiniBar[];
  note: string;
  scaleMax?: number;
}) {
  const max = scaleMax;
  return (
    <div className="flex flex-col border-t border-hairline pt-4">
      <p className="font-heading text-[clamp(1.75rem,1.4rem+1.2vw,2.25rem)] leading-none text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-small font-medium text-ink">
        <Names text={label} />
      </p>
      <ul className="mt-4 space-y-2.5">
        {bars.map((b) => (
          <li key={b.key}>
            <span className="flex items-center gap-1.5 text-[0.8125rem] leading-tight text-muted">
              {b.model && <Marker model={b.model} />}
              <span className="whitespace-nowrap">{b.label}</span>
            </span>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-r-[4px] bg-hairline/60">
                <div
                  className="h-full rounded-r-[4px]"
                  style={{
                    width: b.value === 0 ? "2px" : `${(b.value / max) * 100}%`,
                    backgroundColor: b.color,
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-[0.8125rem] leading-none text-ink tabular-nums">
                {b.shown}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.8125rem] text-faint">{note}</p>
    </div>
  );
}

const BAR = 12; // px, per model
const GAP = 2; // px surface gap between a part's bars

function BarChart({ metric }: { metric: Metric }) {
  return (
    <div className="mt-6" aria-hidden="true">
      {TASKS.map((task) => {
        const row = metric.data[task.id];
        const best = bestModels(metric, row);
        return (
          <div
            key={task.id}
            className="grid grid-cols-1 gap-2 border-t border-hairline py-3.5 sm:grid-cols-[9.5rem_1fr] sm:items-center sm:gap-4"
          >
            <p className="text-small leading-tight">
              <span className="font-medium text-ink">{task.name}</span>
              <span className="meta ml-2 sm:ml-0 sm:block">{task.level}</span>
            </p>

            <div className="relative">
              {TICKS.map((t) => (
                <span
                  key={t}
                  className="absolute -inset-y-1.5 w-px bg-hairline"
                  style={{ left: `${t * 100}%` }}
                />
              ))}
              <div className="relative flex flex-col" style={{ gap: GAP }}>
                {MODELS.map((model) => {
                  const score = row[model.id];
                  // Label the best bar once per row; a row where everyone scored 0 gets none.
                  const labelled =
                    best[0] === model.id && !(metric.better === "higher" && score.value === 0);
                  const inside = score.value > 0.82;
                  return (
                    <div key={model.id} className="group relative" style={{ height: BAR }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-r-[4px] transition-[filter] group-hover:brightness-110"
                        style={{
                          width: score.value === 0 ? "2px" : `${score.value * 100}%`,
                          backgroundColor: SERIES[model.id].color,
                        }}
                      />
                      {labelled && (
                        <span
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.75rem] font-semibold leading-none tabular-nums",
                            inside ? "-translate-x-full pr-1.5 text-[#0a1015]" : "pl-1.5 text-ink"
                          )}
                          style={{ left: `${Math.max(score.value, 0) * 100}%` }}
                        >
                          {fmt(score, metric.decimals)}
                          {best.length > 1 && <span className="font-normal opacity-75"> tie</span>}
                        </span>
                      )}
                      {/* hover target spans the whole lane, bigger than the bar */}
                      <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden whitespace-nowrap rounded-md border border-hairline bg-panel-raised px-2 py-1 text-[0.75rem] text-ink shadow-sm group-hover:block">
                        {model.name}, {task.name}: {fmt(score, metric.decimals)}
                      </span>
                    </div>
                  );
                })}
              </div>
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

      <div className="mt-6 grid gap-8 md:grid-cols-3 md:gap-6">
        <Stat
          value="5 of 5"
          label="parts where Qwen2.5-Coder-7B-Instruct extracted the most requirements"
          bars={MODELS.map((m) => {
            const v = meanOf("requirements", m.id);
            return { key: m.id, model: m.id, label: m.name, value: v, shown: v.toFixed(2), color: SERIES[m.id].color };
          })}
          note="Mean share of requirements extracted across the five parts. Higher is better."
        />
        <Stat
          value={meanOf("pointcloud", "qwen").toFixed(3)}
          label="Qwen2.5-Coder-7B-Instruct's average shape error"
          bars={MODELS.map((m) => {
            const v = meanOf("pointcloud", m.id);
            return { key: m.id, model: m.id, label: m.name, value: v, shown: v.toFixed(3), color: SERIES[m.id].color };
          })}
          note="Mean normalized point-cloud distance across the five parts, scaled to the largest. Lower is better."
          scaleMax={Math.max(...MODELS.map((m) => meanOf("pointcloud", m.id)))}
        />
        {(() => {
          const easy = verdictsWhere((l) => l === "Simple");
          const hard = verdictsWhere((l) => l !== "Simple");
          return (
            <Stat
              value={`${hard.correct} of ${hard.total}`}
              label="correct feedback verdicts on medium and hard parts"
              bars={[
                { key: "simple", label: "Simple parts", value: easy.correct / easy.total, shown: `${easy.correct}/${easy.total}`, color: "var(--accent)" },
                { key: "harder", label: "Medium and hard parts", value: hard.correct / hard.total, shown: `${hard.correct}/${hard.total}`, color: "var(--accent)" },
              ]}
              note="All three models pooled. The feedback loop is the part that needs work next."
            />
          );
        })()}
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

        <BarChart metric={metric} />

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
