"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CalendarClock, Loader2, X } from "lucide-react";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { EmptyState, ErrorState, Shimmer } from "@/components/states";
import { FactorBars } from "@/components/factor-bars";
import { Verdict } from "@/components/verdict";
import { StatusChip } from "@/components/intention-row";
import {
  ApiError,
  intentions as api,
  type CloseStatus,
  type Prediction,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatAgo, formatRelative } from "@/lib/format";
import { DIFFICULTY_LABEL, RISK_THEME, STATUS_THEME } from "@/lib/labels";
import { useResource } from "@/lib/use-resource";
import { cn } from "@/lib/utils";

export default function DetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { timezone } = useAuth();

  const fetcher = useCallback(() => api.detail(id), [id]);
  const {
    status: loadStatus,
    data: intention,
    error: loadError,
    reload,
    setData,
  } = useResource(fetcher, "No se pudo cargar este compromiso.");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(
    async (status: CloseStatus) => {
      setBusy(true);
      setError(null);
      try {
        setData(await api.close(id, status));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "No se pudo guardar.");
      } finally {
        setBusy(false);
      }
    },
    [id, setData],
  );

  if (loadStatus === "error") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 pt-7">
        <BackLink />
        <ErrorState message={loadError} onRetry={reload} />
      </div>
    );
  }

  if (!intention) {
    return (
      <div
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 pt-7"
        aria-busy="true"
      >
        <BackLink />
        <Shimmer className="h-9 w-3/4" />
        <Shimmer className="h-64 w-full rounded-2xl" />
        <Shimmer className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const latest: Prediction | undefined = intention.predictions[0];
  const history = intention.predictions;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 pt-7">
      <BackLink />

      <header className="flex flex-col gap-3">
        <p className="station text-ink-soft">compromiso</p>
        <h1 className="break-words text-[28px] leading-[1.05] sm:text-[34px]">
          {intention.objective}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusChip status={intention.status} />
          <span className="station text-ink-faint">
            {[
              intention.scheduled_at
                ? formatRelative(intention.scheduled_at, timezone)
                : null,
              intention.category,
              DIFFICULTY_LABEL[intention.difficulty],
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </span>
        </div>
        {intention.raw_message && (
          <p className="mt-1 border-l-2 border-rule pl-4 text-[15px] italic leading-relaxed text-ink-mid">
            “{intention.raw_message}”
          </p>
        )}
      </header>

      {error && <ErrorState message={error} />}

      {latest ? (
        <>
          <section className="slab slab-grid -mx-5 flex flex-col items-center gap-6 px-5 py-8 sm:mx-0 sm:rounded-2xl sm:px-7">
            <Verdict
              score={latest.commitment_score}
              risk={latest.risk}
              confidence={latest.confidence}
            />
            <ConfidenceBadge
              confidence={latest.confidence}
              sampleSize={latest.sample_size}
            />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="station text-ink-soft">De dónde salió ese número</h2>
            <FactorBars
              analysis={{
                historical_adherence: latest.historical_adherence,
                time_compatibility: latest.time_compatibility,
                difficulty_fit: latest.difficulty_fit,
                recent_consistency: latest.recent_consistency,
                linguistic_confidence: latest.linguistic_confidence,
              }}
              evidence={{}}
              cappedBy={latest.capped_by}
            />
          </section>
        </>
      ) : (
        <EmptyState
          title="Sin pronóstico"
          description="Esta intención no tiene ninguna predicción guardada."
        />
      )}

      {intention.status === "PENDING" && (
        <section className="flex flex-col gap-4 border-t border-rule pt-7">
          <h2 className="station text-ink-soft">¿Qué pasó?</h2>
          <div className="grid grid-cols-3 gap-2.5">
            <Outcome
              color="var(--good)"
              disabled={busy}
              onClick={() => void close("COMPLETED")}
              icon={<Check className="size-4" />}
              label="Cumplí"
            />
            <Outcome
              color="var(--bad)"
              disabled={busy}
              onClick={() => void close("FAILED")}
              icon={<X className="size-4" />}
              label="Fallé"
            />
            <Outcome
              color="var(--warn)"
              disabled={busy}
              onClick={() => void close("RESCHEDULED")}
              icon={<CalendarClock className="size-4" />}
              label="La moví"
            />
          </div>
          {busy && (
            <p className="station inline-flex items-center gap-2 text-ink-soft">
              <Loader2 className="size-3.5 animate-spin" />
              guardando
            </p>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-5 border-t border-rule pt-7">
          <div>
            <h2 className="station text-ink-soft">Línea de tiempo</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-mid">
              {history.length === 1
                ? "Un pronóstico, y lo que pasó después."
                : `${history.length} pronósticos: cada vez que moviste la hora volví a calcular.`}
            </p>
          </div>

          <ol className="flex flex-col">
            {[...history].reverse().map((prediction, index) => (
              <TimelineStep
                key={prediction.id}
                prediction={prediction}
                index={index}
                timezone={timezone}
              />
            ))}

            {intention.closed_at && (
              <li className="relative flex gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-paper"
                  style={{ background: STATUS_THEME[intention.status].rule }}
                />
                <div className="min-w-0 pb-1">
                  <p className="font-display text-[17px] leading-tight">
                    {STATUS_THEME[intention.status].label}
                  </p>
                  <p className="station mt-1 text-ink-faint">
                    {formatAgo(intention.closed_at)}
                  </p>
                </div>
              </li>
            )}
          </ol>
        </section>
      )}
    </div>
  );
}

function TimelineStep({
  prediction,
  index,
  timezone,
}: {
  prediction: Prediction;
  index: number;
  timezone: string;
}) {
  const theme = RISK_THEME[prediction.risk];
  const recommendation = prediction.recommendation;

  return (
    <li className="relative flex gap-3.5">
      {/* La línea une los pasos. */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[4.5px] top-5 w-px bg-rule"
      />
      <span
        aria-hidden="true"
        className="relative mt-1.5 size-2.5 shrink-0 rounded-full bg-ink-faint ring-4 ring-paper"
      />

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
          <p className="font-display text-[17px] leading-tight">
            {index === 0 ? "Primer pronóstico" : "Recalculado"}
          </p>
          <span
            className={cn(
              "station tnum inline-flex items-center rounded-full border px-2.5 py-1",
              theme.chip,
            )}
          >
            {Math.round(prediction.commitment_score)} · {theme.label}
          </span>
        </div>

        <p className="station mt-1.5 text-ink-faint">
          {formatAgo(prediction.created_at)}
        </p>

        {recommendation?.suggested_at && (
          <p className="mt-2.5 text-sm leading-relaxed text-ink-mid">
            Sugerí moverlo a{" "}
            <span className="font-semibold text-ink">
              {formatRelative(recommendation.suggested_at, timezone)}
            </span>
            {recommendation.accepted === true && (
              <span className="text-good"> · lo aceptaste</span>
            )}
            {recommendation.accepted === false && (
              <span className="text-ink-faint"> · no lo moviste</span>
            )}
          </p>
        )}
      </div>
    </li>
  );
}

function Outcome({
  color,
  disabled,
  onClick,
  icon,
  label,
}: {
  color: string;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ color }}
      className="flex h-12 items-center justify-center gap-2 rounded-lg border border-current/25 bg-paper-2 text-sm font-medium transition-colors hover:bg-current/10 disabled:opacity-45"
    >
      {icon}
      {label}
    </button>
  );
}

function BackLink() {
  return (
    <Link
      href="/historial"
      className="station inline-flex w-fit items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-3.5" />
      historial
    </Link>
  );
}
