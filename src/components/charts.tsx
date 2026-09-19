"use client";

import type { RateSlice, Stats } from "@/lib/api";
import { WEEKDAY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Los gráficos del panel, en SVG y CSS. Sin librerías.
 *
 * Reglas que comparten todos: una sola escala de 0 a 100, el valor siempre
 * escrito al lado (no hace falta pasar el ratón para leerlo), y "sin datos"
 * se dice con palabras en vez de dibujar un cero que no existe.
 */

/** Dos series solo en calibración; el par está validado para daltonismo. */
export const SERIES_PREDICTED = "#5f55c6";
export const SERIES_ACTUAL = "#0093a1";

/* ------------------------------------------------------------------ */
/* Barras horizontales de tasa                                         */
/* ------------------------------------------------------------------ */

export interface RateRow extends RateSlice {
  key: string;
  label: string;
  /** Se resalta la fila más significativa, sin cambiarle el color. */
  highlight?: boolean;
}

export function RateBars({ rows }: { rows: RateRow[] }) {
  if (!rows.some((row) => row.rate !== null)) {
    return <NoData>Todavía no hay compromisos cerrados para medir esto.</NoData>;
  }

  return (
    <ul className="flex flex-col">
      {rows.map((row, index) => {
        const empty = row.rate === null;
        return (
          <li
            key={row.key}
            className={cn(
              "flex flex-col gap-2 py-2.5",
              index > 0 && "border-t border-rule",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  "min-w-0 truncate text-[15px]",
                  row.highlight ? "font-semibold text-ink" : "text-ink-mid",
                )}
              >
                {row.label}
                {row.highlight && (
                  <span className="station ml-2 text-good">tu mejor</span>
                )}
              </span>
              <span className="flex shrink-0 items-baseline gap-2.5">
                {!empty && (
                  <span
                    className="station tnum text-ink-faint"
                    title={`${row.completed} de ${row.total} cumplidas`}
                  >
                    {row.completed}/{row.total}
                  </span>
                )}
                <span
                  className={cn(
                    "tnum w-11 text-right font-display text-[19px] leading-none",
                    empty ? "text-ink-faint" : "text-ink",
                  )}
                >
                  {empty ? "—" : `${row.rate}%`}
                </span>
              </span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-rule">
              {!empty && (
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${row.rate}%`,
                    background: row.highlight ? "var(--good)" : "var(--ink)",
                  }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Días de la semana                                                   */
/* ------------------------------------------------------------------ */

export function WeekdayBars({ data }: { data: Stats["by_weekday"] }) {
  if (!data.some((day) => day.rate !== null)) {
    return <NoData>Aún no hay cierres suficientes para ver tus días.</NoData>;
  }

  // La semana se lee de lunes a domingo; el backend indexa desde domingo.
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <ul className="flex items-end justify-between gap-2">
      {order.map((weekday) => {
        const day = data.find((entry) => entry.weekday === weekday) ?? null;
        const rate = day?.rate ?? null;
        return (
          <li
            key={weekday}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="station tnum text-ink-mid">
              {rate === null ? "—" : rate}
            </span>
            <div
              className="flex h-24 w-full items-end overflow-hidden rounded-sm bg-rule-2"
              title={
                day
                  ? `${WEEKDAY_LABELS[weekday]}: ${day.completed} de ${day.total} cumplidas`
                  : "Sin datos"
              }
            >
              {rate !== null && (
                <div
                  className="w-full rounded-sm bg-ink transition-[height] duration-700 ease-out"
                  style={{ height: `${Math.max(rate, 2)}%` }}
                />
              )}
            </div>
            <span className="station text-ink-faint">
              {WEEKDAY_LABELS[weekday].slice(0, 1)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Tendencia semanal                                                   */
/* ------------------------------------------------------------------ */

const W = 320;
const H = 116;
const PAD = { top: 10, right: 6, bottom: 4, left: 6 };

export function TrendChart({
  data,
  labelOf,
}: {
  data: Stats["trend"];
  labelOf: (weekStart: string) => string;
}) {
  const points = data.filter((week) => week.rate !== null);

  if (points.length < 2) {
    return (
      <NoData>
        Necesito al menos dos semanas con cierres para dibujar la tendencia.
      </NoData>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (innerW * index) / (points.length - 1);
  const y = (rate: number) => PAD.top + innerH * (1 - rate / 100);

  const line = points
    .map((week, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(week.rate!)}`)
    .join(" ");
  const area = `${line} L${x(points.length - 1)},${H - PAD.bottom} L${x(0)},${
    H - PAD.bottom
  } Z`;

  const last = points[points.length - 1];

  return (
    <figure className="m-0 flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Tendencia de cumplimiento por semana. Última semana: ${last.rate}%`}
        preserveAspectRatio="none"
      >
        {[0, 50, 100].map((tick) => (
          <line
            key={tick}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="var(--rule)"
            strokeWidth={1}
            strokeDasharray={tick === 50 ? "2 4" : undefined}
          />
        ))}

        <path d={area} fill="var(--ink)" opacity={0.06} />
        <path
          d={line}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((week, index) => {
          const isLast = index === points.length - 1;
          return (
            <circle
              key={week.week_start}
              cx={x(index)}
              cy={y(week.rate!)}
              r={isLast ? 4.5 : 3}
              fill={isLast ? "var(--accent-ink)" : "var(--paper)"}
              stroke={isLast ? "var(--accent-ink)" : "var(--ink)"}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${labelOf(week.week_start)}: ${week.rate}% (${week.completed}/${week.total})`}</title>
            </circle>
          );
        })}
      </svg>

      <figcaption className="station flex items-baseline justify-between text-ink-faint">
        <span>{labelOf(points[0].week_start)}</span>
        <span className="tnum text-accent-ink">
          esta semana {last.rate}%
        </span>
        <span>{labelOf(last.week_start)}</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Calibración: lo predicho frente a lo que pasó                       */
/* ------------------------------------------------------------------ */

export function CalibrationChart({ data }: { data: Stats["calibration"] }) {
  const rows = data.filter((bucket) => bucket.n > 0);

  if (rows.length === 0) {
    return (
      <NoData>
        Cuando cierres compromisos que ya tenían pronóstico, aquí verás si mis
        números aciertan.
      </NoData>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <LegendKey color={SERIES_PREDICTED} label="lo que predije" />
        <LegendKey color={SERIES_ACTUAL} label="lo que pasó" />
      </ul>

      <ul className="flex flex-col">
        {rows.map((bucket, index) => {
          const gap = Math.abs(bucket.predicted_avg - bucket.actual_rate);
          return (
            <li
              key={bucket.bucket}
              className={cn(
                "flex flex-col gap-2.5 py-3.5",
                index > 0 && "border-t border-rule",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] text-ink-mid">
                  Cuando dije{" "}
                  <span className="tnum font-semibold text-ink">
                    {bucket.bucket}
                  </span>
                </span>
                <span className="station tnum text-ink-faint">
                  n={bucket.n} · desvío {gap}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Paired
                  color={SERIES_PREDICTED}
                  value={bucket.predicted_avg}
                  caption="predicho"
                />
                <Paired
                  color={SERIES_ACTUAL}
                  value={bucket.actual_rate}
                  caption="real"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Paired({
  color,
  value,
  caption,
}: {
  color: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="station w-14 shrink-0 text-ink-faint">{caption}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-rule">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: color,
          }}
        />
      </div>
      <span className="tnum w-11 shrink-0 text-right font-display text-[17px] leading-none text-ink">
        {value}%
      </span>
    </div>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <li className="station flex items-center gap-2 text-ink-mid">
      <span
        aria-hidden="true"
        className="h-2.5 w-4 rounded-full"
        style={{ background: color }}
      />
      {label}
    </li>
  );
}

function NoData({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-rule py-1 pl-4 text-[14px] leading-relaxed text-ink-soft">
      {children}
    </p>
  );
}
