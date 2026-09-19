"use client";

import Link from "next/link";
import { Check, CalendarClock, Loader2, X } from "lucide-react";
import type { CloseStatus, Intention, IntentionStatus, Prediction } from "@/lib/api";
import { formatRelative, isPast } from "@/lib/format";
import { RISK_THEME, STATUS_THEME } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function StatusChip({
  status,
  className,
}: {
  status: IntentionStatus;
  className?: string;
}) {
  const theme = STATUS_THEME[status];
  return (
    <span
      className={cn(
        "station inline-flex shrink-0 items-center rounded-full border px-2.5 py-1",
        theme.chip,
        className,
      )}
    >
      {theme.label}
    </span>
  );
}

/** El score predicho. Es la mitad "predicción" de cada fila. */
export function ScoreChip({ prediction }: { prediction: Prediction }) {
  const theme = RISK_THEME[prediction.risk];
  return (
    <span
      className="flex shrink-0 flex-col items-end leading-none"
      title={`Pronóstico: ${theme.label}`}
    >
      <span
        className="tnum font-display text-[27px] leading-none"
        style={{ color: theme.paper }}
      >
        {Math.round(prediction.commitment_score)}
      </span>
      <span className="station mt-1 text-ink-faint">predicho</span>
    </span>
  );
}

/**
 * Una fila del historial: lo que se predijo frente a lo que pasó.
 *
 * Es una fila de tabla, no una tarjeta: filete arriba y un filete vertical de
 * color que codifica el resultado. Así diez filas seguidas se leen como una
 * lista y no como diez objetos sueltos.
 */
export function IntentionRow({
  intention,
  timezone,
  busy = false,
  onClose,
}: {
  intention: Intention;
  timezone: string;
  busy?: boolean;
  onClose?: (id: string, status: CloseStatus) => void;
}) {
  const prediction = intention.predictions[0];
  const theme = STATUS_THEME[intention.status];
  const pending = intention.status === "PENDING";
  const overdue = pending && isPast(intention.scheduled_at);

  return (
    <li className="relative border-t border-rule">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: theme.rule }}
      />

      <div className="flex flex-col gap-3 py-4 pl-4">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/historial/${intention.id}`}
            className="min-w-0 flex-1 rounded outline-offset-4"
          >
            <span className="block break-words font-display text-[17px] leading-[1.25] hover:underline">
              {intention.objective}
            </span>
            <span className="station mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-faint">
              {intention.scheduled_at && (
                <span>{formatRelative(intention.scheduled_at, timezone)}</span>
              )}
              {intention.category && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{intention.category}</span>
                </>
              )}
            </span>
          </Link>

          {prediction && <ScoreChip prediction={prediction} />}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={intention.status} />
          {overdue && (
            <span className="station text-alert">su hora ya pasó</span>
          )}
          {busy && <Loader2 className="size-3.5 animate-spin text-ink-faint" />}
        </div>

        {pending && onClose && (
          <div className="grid grid-cols-3 gap-2 pr-4">
            <CloseButton
              label="Cumplí"
              icon={<Check className="size-3.5" />}
              color="var(--good)"
              disabled={busy}
              onClick={() => onClose(intention.id, "COMPLETED")}
            />
            <CloseButton
              label="Fallé"
              icon={<X className="size-3.5" />}
              color="var(--bad)"
              disabled={busy}
              onClick={() => onClose(intention.id, "FAILED")}
            />
            <CloseButton
              label="La moví"
              icon={<CalendarClock className="size-3.5" />}
              color="var(--warn)"
              disabled={busy}
              onClick={() => onClose(intention.id, "RESCHEDULED")}
            />
          </div>
        )}
      </div>
    </li>
  );
}

function CloseButton({
  label,
  icon,
  color,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ color }}
      className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-current/25 bg-paper-2 text-[13px] font-medium transition-colors hover:bg-current/10 disabled:opacity-45"
    >
      {icon}
      {label}
    </button>
  );
}
