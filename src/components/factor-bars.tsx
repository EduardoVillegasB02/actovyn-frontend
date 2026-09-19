"use client";

import { TriangleAlert } from "lucide-react";
import type { Analysis, Evidence, EvidenceKey, FactorKey } from "@/lib/api";
import { FACTOR_KEYS } from "@/lib/api";
import { FACTOR_HINT, FACTOR_LABEL } from "@/lib/labels";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const CAPPED_TEXT = "Este factor topeó el score: evidencia fuerte en contra";

const EVIDENCE_KEYS: readonly EvidenceKey[] = [
  "historical_adherence",
  "time_compatibility",
  "difficulty_fit",
];

function isEvidenceKey(key: FactorKey): key is EvidenceKey {
  return (EVIDENCE_KEYS as readonly FactorKey[]).includes(key);
}

/**
 * La evidencia: cinco lecturas, en filas separadas por filetes.
 *
 * No son tarjetas a propósito. Es una tabla de mediciones, y lo único que
 * rompe esa regularidad es el factor que topó el score, que se lleva el
 * filete rojo y la marca. Así el ojo va primero a la causa.
 */
export function FactorBars({
  analysis,
  evidence,
  cappedBy,
}: {
  analysis: Analysis;
  evidence: Evidence;
  cappedBy: string[];
}) {
  return (
    <ul className="flex flex-col">
      {FACTOR_KEYS.map((key, index) => {
        const value = Math.max(0, Math.min(100, analysis[key] ?? 0));
        const rounded = Math.round(value);
        const samples = isEvidenceKey(key) ? evidence[key] : undefined;
        const capped = cappedBy.includes(key);

        return (
          <li
            key={key}
            className={cn(
              "relative py-3.5",
              index > 0 && "border-t border-rule",
              capped && "-mx-3 bg-bad-soft/60 px-3",
            )}
            style={{ animationDelay: `${140 + index * 55}ms` }}
          >
            {capped && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px] bg-bad"
              />
            )}

            <div className="flex items-baseline justify-between gap-3">
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    "min-w-0 text-left text-[15px] leading-snug underline-offset-4 decoration-dotted hover:underline",
                    capped ? "font-semibold text-bad" : "text-ink",
                  )}
                >
                  {FACTOR_LABEL[key]}
                </TooltipTrigger>
                <TooltipContent>{FACTOR_HINT[key]}</TooltipContent>
              </Tooltip>

              <span
                className={cn(
                  "tnum shrink-0 font-display text-[22px] leading-none",
                  capped ? "text-bad" : "text-ink",
                )}
              >
                {rounded}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              {/* Barra fina: es una lectura, no un adorno. */}
              <div className="h-[3px] flex-1 rounded-full bg-rule">
                <div
                  className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
                  style={{
                    width: `${value}%`,
                    background: capped ? "var(--bad)" : "var(--ink)",
                  }}
                />
              </div>
              {typeof samples === "number" && (
                <span className="station shrink-0 text-ink-faint">
                  {samples} {samples === 1 ? "registro" : "registros"}
                </span>
              )}
            </div>

            {capped && (
              <Tooltip>
                <TooltipTrigger
                  aria-label={CAPPED_TEXT}
                  className="station mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-bad px-2.5 py-1 text-white"
                >
                  <TriangleAlert className="size-3" />
                  topeó el score
                </TooltipTrigger>
                <TooltipContent>{CAPPED_TEXT}</TooltipContent>
              </Tooltip>
            )}
          </li>
        );
      })}
    </ul>
  );
}
