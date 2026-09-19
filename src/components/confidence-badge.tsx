import { ShieldAlert } from "lucide-react";
import type { Confidence } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Siempre visible, nunca decorativo.
 *
 * Con confianza baja deja de ser una pastilla y pasa a ser un bloque que
 * cambia cómo se lee el número: dice que la muestra es corta y por qué eso
 * importa. Va sobre la losa, así que sus colores son los de ese fondo.
 */
export function ConfidenceBadge({
  confidence,
  sampleSize,
  className,
}: {
  confidence: Confidence;
  sampleSize: number;
  className?: string;
}) {
  if (confidence === "LOW") {
    return (
      <div
        role="status"
        className={cn(
          "flex w-full items-start gap-3 rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-4 py-3.5",
          className,
        )}
      >
        <ShieldAlert className="mt-0.5 size-[18px] shrink-0 text-[#fbbf24]" />
        <div className="min-w-0 text-sm leading-snug">
          <p className="font-semibold text-[#fbbf24]">
            Predicción provisional · n={sampleSize}
          </p>
          <p className="mt-1 text-slab-mid">
            {sampleSize === 0
              ? "Todavía no sé nada de ti. Este número es un punto de partida, no un pronóstico."
              : "Con tan pocos registros el número se mueve mucho. Gana precisión con cada compromiso que cierres."}
          </p>
        </div>
      </div>
    );
  }

  const high = confidence === "HIGH";

  return (
    <div
      role="status"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-slab-rule px-3.5 py-1.5",
        className,
      )}
    >
      {/* Tres muescas: llenas según el nivel. Se lee sin leer. */}
      <span aria-hidden="true" className="flex items-center gap-[3px]">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn(
              "h-2.5 w-[3px] rounded-full",
              index < (high ? 3 : 2) ? "bg-slab-ink" : "bg-slab-rule",
            )}
          />
        ))}
      </span>
      <span className="station text-slab-mid">
        confianza {high ? "alta" : "media"}
      </span>
      <span className="tnum text-xs text-slab-soft">n={sampleSize}</span>
    </div>
  );
}
