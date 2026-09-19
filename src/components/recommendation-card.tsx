"use client";

import { ArrowRight, Clock, Loader2 } from "lucide-react";
import type { Recommendation } from "@/lib/api";
import { formatRelative } from "@/lib/format";

/**
 * El consejo y, cuando propone una hora concreta, el botón que la aplica.
 *
 * Ese botón es la acción con más valor: mueve la intención y vuelve a
 * predecir, así que el salto del número se ve en vivo. Por eso es el único
 * sitio de la pantalla donde aparece el acento a pleno.
 */
export function RecommendationCard({
  recommendation,
  timezone,
  onAccept,
  accepting = false,
  accepted = null,
}: {
  recommendation: Recommendation;
  timezone: string;
  onAccept?: (suggestedAt: string) => void;
  accepting?: boolean;
  accepted?: boolean | null;
}) {
  const { reason, suggestion, suggested_at: suggestedAt } = recommendation;
  const when = suggestedAt ? formatRelative(suggestedAt, timezone) : "";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="station text-ink-soft">Qué hacer con esto</h2>

      {reason && (
        <p className="text-[15px] leading-[1.65] text-ink-mid">{reason}</p>
      )}

      {suggestion && (
        <div className="overflow-hidden rounded-lg border border-accent-line bg-accent-soft">
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <p className="font-display text-[19px] leading-[1.25] text-ink">
              {suggestion}
            </p>

            {when && (
              <p className="inline-flex items-center gap-2 text-sm text-ink-mid">
                <Clock className="size-4 shrink-0" />
                <span className="station">hora sugerida</span>
                <span className="font-semibold text-ink">{when}</span>
              </p>
            )}
          </div>

          {suggestedAt && onAccept && accepted !== true && (
            <button
              type="button"
              onClick={() => onAccept(suggestedAt)}
              disabled={accepting}
              className="group flex w-full items-center justify-between gap-3 bg-accent-ink px-4 py-4 text-left text-white transition-colors hover:bg-ink disabled:opacity-60 sm:px-5"
            >
              <span className="font-display text-[17px]">
                {accepting ? "Recalculando…" : "Mover a esa hora"}
              </span>
              {accepting ? (
                <Loader2 className="size-5 shrink-0 animate-spin" />
              ) : (
                <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          )}

          {accepted === true && (
            <p className="station border-t border-accent-line px-4 py-3 text-good sm:px-5">
              aceptaste esta sugerencia
            </p>
          )}
        </div>
      )}
    </section>
  );
}
