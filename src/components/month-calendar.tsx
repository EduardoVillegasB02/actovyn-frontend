"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Intention, IntentionStatus } from "@/lib/api";
import { dayKeyOf, formatTime } from "@/lib/format";
import { STATUS_THEME } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * El mes de un vistazo.
 *
 * La lista responde "qué pasó con esto"; el calendario responde "cómo me fue
 * en general", que es una pregunta distinta y se contesta mirando, no leyendo.
 * Cada día es un cuadro con un punto por compromiso, coloreado por resultado.
 *
 * Solo entran los compromisos con hora: los que no la tienen no pertenecen a
 * ningún día, y ponerlos en uno cualquiera sería inventar.
 */

const WEEK = ["L", "M", "M", "J", "V", "S", "D"] as const;

/** Orden de prioridad cuando un día tiene varios resultados distintos. */
const RANK: IntentionStatus[] = [
  "FAILED",
  "RESCHEDULED",
  "PENDING",
  "COMPLETED",
  "CANCELLED",
  "DRAFT",
];

export interface CalendarMonth {
  year: number;
  /** 0-11, como Date. */
  month: number;
}

export function monthKey({ year, month }: CalendarMonth): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Rango UTC que cubre el mes entero, con margen para cualquier zona. */
export function monthRange(cursor: CalendarMonth): { from: string; to: string } {
  const from = new Date(Date.UTC(cursor.year, cursor.month, 1, 0, 0, 0));
  const to = new Date(Date.UTC(cursor.year, cursor.month + 1, 1, 0, 0, 0));
  return {
    from: new Date(from.getTime() - 36e5 * 26).toISOString(),
    to: new Date(to.getTime() + 36e5 * 26).toISOString(),
  };
}

export function thisMonth(): CalendarMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthLabel({ year, month }: CalendarMonth): string {
  return new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 15)));
}

/** Las celdas del mes, empezando en lunes y completando la primera semana. */
function buildGrid(cursor: CalendarMonth): (string | null)[] {
  const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
  // getUTCDay da 0 para domingo; la rejilla empieza el lunes.
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(
    Date.UTC(cursor.year, cursor.month + 1, 0),
  ).getUTCDate();

  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(
      `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  return cells;
}

export function MonthCalendar({
  items,
  timezone,
  cursor,
  onCursorChange,
  loading = false,
}: {
  items: Intention[];
  timezone: string;
  cursor: CalendarMonth;
  onCursorChange: (next: CalendarMonth) => void;
  loading?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  /** Compromisos agrupados por día local. */
  const byDay = useMemo(() => {
    const map = new Map<string, Intention[]>();
    for (const item of items) {
      const key = dayKeyOf(item.scheduled_at, timezone);
      if (!key) continue;
      const bucket = map.get(key);
      if (bucket) bucket.push(item);
      else map.set(key, [item]);
    }
    return map;
  }, [items, timezone]);

  const cells = useMemo(() => buildGrid(cursor), [cursor]);
  const today = dayKeyOf(new Date().toISOString(), timezone);
  const undated = items.filter((item) => !item.scheduled_at).length;

  function shift(delta: number) {
    const next = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    setSelected(null);
    onCursorChange({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  }

  const selectedItems = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[19px] capitalize leading-none">
          {monthLabel(cursor)}
        </h2>
        <div className="flex items-center gap-1.5">
          <NavButton onClick={() => shift(-1)} label="Mes anterior">
            <ChevronLeft className="size-4" />
          </NavButton>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              onCursorChange(thisMonth());
            }}
            className="station rounded-md border border-rule px-2.5 py-2 text-ink-mid transition-colors hover:border-ink hover:text-ink"
          >
            hoy
          </button>
          <NavButton onClick={() => shift(1)} label="Mes siguiente">
            <ChevronRight className="size-4" />
          </NavButton>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-1.5 transition-opacity",
          loading && "opacity-40",
        )}
        aria-busy={loading || undefined}
      >
        <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
          {WEEK.map((day, index) => (
            <span
              key={index}
              className="station py-1 text-center text-ink-faint"
            >
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((key, index) => {
            if (!key) return <span key={`gap-${index}`} />;

            const dayItems = byDay.get(key) ?? [];
            const dominant = RANK.find((status) =>
              dayItems.some((item) => item.status === status),
            );
            const isToday = key === today;
            const isSelected = key === selected;

            return (
              <button
                key={key}
                type="button"
                disabled={dayItems.length === 0}
                onClick={() => setSelected(isSelected ? null : key)}
                aria-label={`${Number(key.slice(-2))}: ${
                  dayItems.length === 0
                    ? "sin compromisos"
                    : `${dayItems.length} compromiso${dayItems.length === 1 ? "" : "s"}`
                }`}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border transition-colors",
                  dayItems.length === 0
                    ? "border-transparent bg-rule-2/45 text-ink-faint"
                    : "border-rule bg-paper-2 hover:border-ink",
                  isSelected && "border-ink ring-1 ring-ink",
                  isToday && !isSelected && "border-accent-ink",
                )}
              >
                <span
                  className={cn(
                    "tnum text-[13px] leading-none",
                    isToday ? "font-semibold text-accent-ink" : "text-ink-mid",
                  )}
                >
                  {Number(key.slice(-2))}
                </span>

                {dayItems.length > 0 && (
                  <span className="flex items-center gap-[3px]">
                    {dayItems.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="size-[5px] rounded-full"
                        style={{ background: STATUS_THEME[item.status].rule }}
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <span
                        className="size-[5px] rounded-full"
                        style={{ background: STATUS_THEME[dominant!].rule }}
                      />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda: sin ella los puntos de color no significan nada. */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {(["COMPLETED", "FAILED", "RESCHEDULED", "PENDING"] as const).map(
          (status) => (
            <li
              key={status}
              className="station flex items-center gap-1.5 text-ink-faint"
            >
              <span
                className="size-[7px] rounded-full"
                style={{ background: STATUS_THEME[status].rule }}
              />
              {STATUS_THEME[status].label}
            </li>
          ),
        )}
      </ul>

      {selected && (
        <div className="flex flex-col gap-2 border-t border-rule pt-4">
          <p className="station text-ink-soft">
            {new Intl.DateTimeFormat("es-PE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            }).format(new Date(`${selected}T12:00:00Z`))}
          </p>
          <ul className="flex flex-col">
            {selectedItems.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-start justify-between gap-3 py-2.5",
                  index > 0 && "border-t border-rule",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[15px] leading-snug">
                    {item.objective}
                  </span>
                  <span className="station mt-1 block text-ink-faint">
                    {formatTime(item.scheduled_at, timezone)}
                  </span>
                </span>
                <span
                  className={cn(
                    "station shrink-0 rounded-full border px-2.5 py-1",
                    STATUS_THEME[item.status].chip,
                  )}
                >
                  {STATUS_THEME[item.status].label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {undated > 0 && (
        <p className="station text-ink-faint">
          {undated} sin hora, no aparecen en el calendario
        </p>
      )}
    </div>
  );
}

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-md border border-rule text-ink-mid transition-colors hover:border-ink hover:text-ink"
    >
      {children}
    </button>
  );
}
