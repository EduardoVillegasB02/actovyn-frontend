"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ErrorState, EmptyState, Shimmer } from "@/components/states";
import { FactorBars } from "@/components/factor-bars";
import { RecommendationCard } from "@/components/recommendation-card";
import { Verdict } from "@/components/verdict";
import { ApiError, intentions } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelative } from "@/lib/format";
import { DIFFICULTY_LABEL } from "@/lib/labels";
import {
  clearDraft,
  parseDraft,
  readRawDraft,
  readRawDraftServer,
  saveDraft,
  subscribeDraft,
  type StoredDraft,
} from "@/lib/draft-store";
import { cn } from "@/lib/utils";

type Busy = "reschedule" | "commit" | "discard" | "reanalyze" | null;

export default function ResultadoPage() {
  const router = useRouter();
  const { timezone } = useAuth();

  const raw = useSyncExternalStore(
    subscribeDraft,
    readRawDraft,
    readRawDraftServer,
  );
  const stored = useMemo(
    () => (raw === undefined ? undefined : parseDraft(raw)),
    [raw],
  );

  const [local, setLocal] = useState<StoredDraft | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const draft = local ?? (stored === undefined ? null : stored);

  const persist = useCallback((next: StoredDraft) => {
    setLocal(next);
    saveDraft(next);
  }, []);

  /** Aplica la hora sugerida: mueve la intención y vuelve a predecir. */
  const accept = useCallback(
    async (suggestedAt: string) => {
      if (!draft) return;
      setBusy("reschedule");
      setError(null);
      try {
        const response = await intentions.reschedule(
          draft.result.intention.id,
          suggestedAt,
        );
        persist({
          message: draft.message,
          previousScore: response.previous_score,
          result: {
            ...response.prediction,
            intention: {
              id: response.intention.id,
              objective: response.intention.objective,
              category: response.intention.category,
              scheduled_at: response.intention.scheduled_at,
              local_hour: response.intention.local_hour,
              difficulty: response.intention.difficulty,
              status: response.intention.status,
            },
          },
        });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "No se pudo mover la hora.");
      } finally {
        setBusy(null);
      }
    },
    [draft, persist],
  );

  const commit = useCallback(async () => {
    if (!draft) return;
    setBusy("commit");
    setError(null);
    try {
      await intentions.commit(draft.result.intention.id);
      clearDraft();
      router.push("/historial");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "No se pudo guardar el compromiso.",
      );
      setBusy(null);
    }
  }, [draft, router]);

  const discard = useCallback(async () => {
    if (!draft) return;
    setBusy("discard");
    setError(null);
    try {
      await intentions.discard(draft.result.intention.id);
    } catch {
      // Si ya no existe, da igual: el objetivo era quitarlo de en medio.
    } finally {
      clearDraft();
      router.push("/");
    }
  }, [draft, router]);

  const reanalyze = useCallback(async () => {
    if (!draft) return;
    setBusy("reanalyze");
    setError(null);
    try {
      const result = await intentions.analyze(draft.message);
      persist({ message: draft.message, result, previousScore: null });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo reanalizar.");
    } finally {
      setBusy(null);
    }
  }, [draft, persist]);

  if (stored === undefined && local === null) return <ResultSkeleton />;

  if (!draft) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pt-10">
        <EmptyState
          title="Todavía no hay ningún pronóstico"
          description="Escribe qué planeas hacer y te diré si lo vas a cumplir."
          actionLabel="Ir a analizar"
          actionHref="/"
        />
      </div>
    );
  }

  if (busy === "reanalyze" || busy === "reschedule") {
    return (
      <ResultSkeleton
        label={
          busy === "reschedule"
            ? "recalculando con la hora nueva"
            : "analizando de nuevo"
        }
      />
    );
  }

  const { result, previousScore } = draft;
  const { intention, analysis, evidence, recommendation } = result;

  return (
    <div className="flex flex-col">
      {/* LA LOSA: el veredicto, a sangre. */}
      <section
        className="slab slab-grid rise px-5 pb-9 pt-7 sm:mx-auto sm:mt-5 sm:w-[calc(100%-2.5rem)] sm:max-w-2xl sm:rounded-2xl sm:px-7"
        aria-label="Pronóstico"
      >
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            <p className="station text-slab-soft">probabilidad de cumplir</p>
            <p className="station text-slab-soft">borrador</p>
          </div>

          <h1 className="mt-3 break-words font-display text-[27px] leading-[1.08] text-slab-ink sm:text-[32px]">
            {intention.objective}
          </h1>

          <p className="station mt-2.5 flex flex-wrap gap-x-2.5 gap-y-1 text-slab-soft">
            {[
              intention.scheduled_at
                ? formatRelative(intention.scheduled_at, timezone)
                : null,
              intention.category,
              DIFFICULTY_LABEL[intention.difficulty],
            ]
              .filter(Boolean)
              .map((bit, index) => (
                <span key={index} className="flex items-center gap-2.5">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-slab-rule">
                      ·
                    </span>
                  )}
                  {bit}
                </span>
              ))}
          </p>

          <div className="mt-7 flex flex-col items-center gap-6">
            <Verdict
              score={result.commitment_score}
              risk={result.risk}
              confidence={result.confidence}
              previousScore={previousScore}
            />
            <ConfidenceBadge
              confidence={result.confidence}
              sampleSize={result.sample_size}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-9 px-5 pt-8">
        {/* LA EVIDENCIA: en papel, en filas, sin tarjetas. */}
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="station text-ink-soft">De dónde sale ese número</h2>
            <span className="station text-ink-faint">0–100</span>
          </div>
          <FactorBars
            analysis={analysis}
            evidence={evidence}
            cappedBy={result.capped_by}
          />
        </section>

        <RecommendationCard
          recommendation={recommendation}
          timezone={timezone}
          onAccept={(suggestedAt) => void accept(suggestedAt)}
        />

        {error && <ErrorState message={error} />}

        {/* LA DECISIÓN */}
        <section className="flex flex-col gap-3 border-t border-rule pt-7">
          <button
            type="button"
            onClick={() => void commit()}
            disabled={busy !== null}
            className={cn(
              "group flex w-full items-center justify-between gap-3 rounded-lg bg-ink px-5 py-4 text-left text-paper transition-colors hover:bg-accent-ink disabled:opacity-60",
            )}
          >
            <span className="flex flex-col">
              <span className="font-display text-[19px] leading-tight">
                {busy === "commit" ? "Guardando…" : "Me comprometo"}
              </span>
              <span className="station mt-1 text-white/45">
                entra en tu historial
              </span>
            </span>
            {busy === "commit" ? (
              <Loader2 className="size-5 shrink-0 animate-spin" />
            ) : (
              <Check className="size-5 shrink-0 transition-transform group-hover:scale-110" />
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <SecondaryAction
              onClick={() => void reanalyze()}
              disabled={busy !== null}
              icon={<RefreshCw className="size-4" />}
              label="Reanalizar"
            />
            <SecondaryAction
              onClick={() => void discard()}
              disabled={busy !== null}
              icon={
                busy === "discard" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )
              }
              label="Descartar"
            />
          </div>

          <p className="mt-1 text-center text-[13px] leading-relaxed text-ink-soft">
            Mientras no te comprometas esto es solo un borrador: no cuenta en tu
            historial ni en tus patrones.
          </p>
        </section>

        <Link
          href="/"
          className="station self-center text-ink-soft underline decoration-rule underline-offset-[6px] hover:text-ink"
        >
          analizar otra cosa
        </Link>
      </div>
    </div>
  );
}

function SecondaryAction({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center justify-center gap-2 rounded-lg border border-rule bg-paper-2 text-sm font-medium text-ink-mid transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}

/** El esqueleto respeta la losa: no hay salto de fondo al llegar el dato. */
function ResultSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex flex-col" aria-busy="true" aria-live="polite">
      <section className="slab slab-grid px-5 pb-9 pt-7 sm:mx-auto sm:mt-5 sm:w-[calc(100%-2.5rem)] sm:max-w-2xl sm:rounded-2xl sm:px-7">
        <div className="mx-auto w-full max-w-2xl">
          <p className="station text-slab-soft">
            {label ?? "consultando tu historial"}
          </p>

          <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="mt-2.5 h-3 w-1/2 animate-pulse rounded bg-white/[0.07]" />

          <div className="mt-9 flex flex-col items-center gap-6">
            <div className="relative size-[210px]">
              <svg viewBox="0 0 210 210" className="size-full" aria-hidden="true">
                <path
                  d="M32 165 A 85 85 0 1 1 178 165"
                  fill="none"
                  stroke="rgba(255,255,255,.08)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="size-16 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>
            <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 pt-8">
        <Shimmer className="h-3 w-44" />
        <div className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2.5">
              <div className="flex justify-between">
                <Shimmer className="h-4 w-48" />
                <Shimmer className="h-5 w-8" />
              </div>
              <Shimmer className="h-[3px] w-full rounded-full" />
            </div>
          ))}
        </div>
        <Shimmer className="h-28 w-full rounded-lg" />
      </div>
    </div>
  );
}
