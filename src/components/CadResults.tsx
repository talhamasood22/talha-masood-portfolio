"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  METRICS,
  MODELS,
  SHOWN_METRIC_IDS,
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

const SHOWN: Metric[] = SHOWN_METRIC_IDS.map((id) => METRICS.find((m) => m.id === id)!);
const TICKS = [0, 0.25, 0.5, 0.75, 1];
const BAR = 12; // px, per model
const GAP = 2; // px surface gap between a part's bars

/** Exactly as the slides print it: 0.8, 0.217, 0.330. Never re-rounded. */
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

/** The three models as chips, each with its chart marker so they double as a key. */
export function CadModelChips() {
  return (
    <div className="mt-6">
      <p className="meta">Models compared</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {MODELS.map((m) => (
          <li key={m.id}>
            <Badge className="text-ink">
              <Marker model={m.id} />
              {m.name}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The best score in a row; ties all count as best. */
function bestModels(metric: Metric, row: Record<ModelId, Score>): ModelId[] {
  const values = MODELS.map((m) => row[m.id].value);
  const target = metric.better === "higher" ? Math.max(...values) : Math.min(...values);
  return MODELS.filter((m) => row[m.id].value === target).map((m) => m.id);
}

function BarChart({ metric }: { metric: Metric }) {
  const longerIsBetter = metric.better === "higher";
  return (
    <div className="mt-5" aria-hidden="true">
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
                    best[0] === model.id && !(longerIsBetter && score.value === 0);
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
                          style={{ left: `${score.value * 100}%` }}
                        >
                          {fmt(score, metric.decimals)}
                          {best.length > 1 && <span className="font-normal opacity-75"> tie</span>}
                        </span>
                      )}
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
        <div>
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
          {/* The direction cue: the one thing that changes meaning between tabs. */}
          <p
            className={cn(
              "mt-2 flex items-center gap-1.5 text-small font-medium text-ink",
              longerIsBetter ? "justify-end" : "justify-start"
            )}
          >
            {longerIsBetter ? (
              <>
                Longer bar is better
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Shorter bar is better
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function DataTable({ metric }: { metric: Metric }) {
  return (
    <div className="sr-only">
      <table>
        <caption>
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
 * The evaluation results of the multi-agent CAD project, for a reader who
 * isn't an ML specialist: the takeaway in two sentences, the weak spot in
 * one, then a chart for three plain metrics.
 */
export function CadResults() {
  const [metricId, setMetricId] = useState<string>(SHOWN[0].id);
  const metric = SHOWN.find((m) => m.id === metricId) ?? SHOWN[0];

  return (
    <section
      aria-labelledby="cad-results-heading"
      className="border-t border-hairline pt-8 md:col-span-12"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h4 id="cad-results-heading" className="text-h3 font-semibold text-ink">
          What we found
        </h4>
        <p className="meta">5 test parts, simple to hard · 10 runs per model</p>
      </div>

      <div className="mt-4 max-w-[68ch] space-y-3">
        <p className="text-base leading-relaxed text-ink text-pretty">
          <Names text="Qwen2.5-Coder-7B-Instruct was the strongest model, both at understanding requests and at building accurate parts. The pipeline works well on simple parts; complex ones, like a chair, stayed hard for all three models." />
        </p>
        <p className="text-small leading-relaxed text-muted text-pretty">
          <span className="font-medium text-ink">Weak spot:</span> the check step compared
          only sizes and volume, not the actual shape, so it couldn&apos;t tell a good
          medium or hard part from a bad one. Comparing the geometry itself, for example with
          a vision model, is the next fix.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Choose a result">
        {SHOWN.map((m) => (
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

      <div className="mt-5" aria-live="polite">
        <p className="max-w-[68ch] text-small text-muted">{metric.definition}</p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
          {MODELS.map((m) => (
            <li key={m.id} className="flex items-center gap-1.5 text-small text-muted">
              <Marker model={m.id} />
              {m.name}
            </li>
          ))}
        </ul>

        <BarChart metric={metric} />

        <p className="mt-5 max-w-[68ch] text-base text-ink text-pretty">
          <Names text={metric.finding} />
        </p>

        {/* The chart is drawn for the eye; screen readers get the same numbers here. */}
        <DataTable metric={metric} />
      </div>
    </section>
  );
}
