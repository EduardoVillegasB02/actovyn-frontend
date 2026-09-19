"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Confidence, Risk } from "@/lib/api";
import { RISK_THEME, RISK_ZONES } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * El veredicto: el número, el arco de zonas y la etiqueta de riesgo.
 *
 * Es el momento de la aplicación, así que se monta como una secuencia corta:
 * el arco barre hasta su posición y la cifra sube hasta el valor. Con
 * prefers-reduced-motion todo aparece ya colocado.
 */

/* Geometría del arco: 250°, abierto abajo, como un instrumento de aguja. */
const SWEEP = 250;
const START = 90 + (360 - SWEEP) / 2;
const SIZE = 260;
const R = 104;
const TRACK = 10;
const CX = SIZE / 2;
const CY = SIZE / 2;

function polar(value: number): [number, number] {
  const angle = ((START + (value / 100) * SWEEP) * Math.PI) / 180;
  return [CX + R * Math.cos(angle), CY + R * Math.sin(angle)];
}

function arcPath(from: number, to: number): string {
  const [x1, y1] = polar(from);
  const [x2, y2] = polar(to);
  const large = ((to - from) / 100) * SWEEP > 180 ? 1 : 0;
  return `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Sube la cifra hasta su valor. El arco y el número llegan a la vez. */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const frame = useRef<number>(0);

  useEffect(() => {
    // Todo el estado se toca dentro del frame, nunca en el cuerpo del efecto.
    const start = performance.now();

    const tick = (now: number) => {
      if (prefersReducedMotion()) {
        setValue(target);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      // Desaceleración: llega rápido y se posa, como una aguja.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}

export function Verdict({
  score,
  risk,
  confidence,
  previousScore = null,
}: {
  score: number;
  risk: Risk;
  confidence: Confidence;
  previousScore?: number | null;
}) {
  const theme = RISK_THEME[risk];
  const target = Math.max(0, Math.min(100, score));
  const animated = useCountUp(target);
  const shown = Math.round(animated);
  const provisional = confidence === "LOW";

  const [markX, markY] = polar(animated);
  const delta =
    previousScore === null ? null : Math.round(target) - Math.round(previousScore);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE * 0.82, maxWidth: "100%" }}
        role="img"
        aria-label={`Pronóstico ${Math.round(target)} sobre 100. ${theme.label}${
          provisional ? ". Predicción provisional" : ""
        }`}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE * 0.82}`}
          className="block h-full w-full overflow-visible"
          aria-hidden="true"
        >
          {/* Las cinco zonas de riesgo, tenues: enseñan la escala. */}
          {RISK_ZONES.map((zone) => (
            <path
              key={zone.risk}
              d={arcPath(zone.from + 0.8, zone.to - 0.8)}
              fill="none"
              stroke={RISK_THEME[zone.risk].slab}
              strokeWidth={TRACK}
              strokeLinecap="round"
              opacity={zone.risk === risk ? 0.38 : 0.13}
            />
          ))}

          {/* El recorrido alcanzado, en el color del veredicto. */}
          <path
            d={arcPath(0.8, Math.max(1.2, animated))}
            fill="none"
            stroke={theme.slab}
            strokeWidth={TRACK}
            strokeLinecap="round"
            opacity={provisional ? 0.5 : 1}
          />

          {/* La marca: dice exactamente dónde cayó. */}
          <circle
            cx={markX}
            cy={markY}
            r={TRACK / 2 + 4.5}
            fill="var(--slab)"
            stroke={theme.slab}
            strokeWidth={3}
            opacity={provisional ? 0.6 : 1}
          />

          {/* Los extremos de la escala, en la voz de los instrumentos. */}
          <text
            x={polar(0)[0] - 4}
            y={polar(0)[1] + 20}
            textAnchor="middle"
            className="station"
            fill="var(--slab-soft)"
          >
            0
          </text>
          <text
            x={polar(100)[0] + 4}
            y={polar(100)[1] + 20}
            textAnchor="middle"
            className="station"
            fill="var(--slab-soft)"
          >
            100
          </text>
        </svg>

        {/*
          Dentro del arco solo va la cifra. Cualquier texto debajo cruzaría el
          trazo en los extremos, y la escala ya la dicen las marcas 0 y 100.
          El centro óptico es el del círculo, no el de la caja.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center"
          style={{ top: CY, transform: "translateY(-50%)" }}
        >
          <span
            className={cn(
              "tnum font-display leading-[0.85] tracking-[-0.055em]",
              provisional && "opacity-60",
            )}
            style={{ color: theme.slab, fontSize: "clamp(72px, 24vw, 92px)" }}
          >
            {shown}
          </span>
        </div>
      </div>

      <div className="mt-1 flex flex-col items-center gap-1.5 text-center">
        <p
          className="font-display text-[26px] leading-none"
          style={{ color: theme.slab }}
        >
          {theme.label}
        </p>
        <p className="max-w-[28ch] text-[15px] text-slab-mid">{theme.blurb}</p>
      </div>

      {delta !== null && delta !== 0 && (
        <p
          className={cn(
            "mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm",
            delta > 0
              ? "border-[#4ade80]/35 bg-[#4ade80]/10 text-[#4ade80]"
              : "border-[#fb7185]/35 bg-[#fb7185]/10 text-[#fb7185]",
          )}
        >
          {delta > 0 ? (
            <ArrowUpRight className="size-4" />
          ) : (
            <ArrowDownRight className="size-4" />
          )}
          <span className="tnum font-medium">
            {Math.round(previousScore!)} → {Math.round(target)}
          </span>
          <span className="tnum opacity-70">
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </p>
      )}
    </div>
  );
}
