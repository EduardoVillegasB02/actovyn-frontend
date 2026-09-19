"use client";

import { useCallback } from "react";
import { Flame, Target } from "lucide-react";
import {
  CalibrationChart,
  RateBars,
  TrendChart,
  WeekdayBars,
  type RateRow,
} from "@/components/charts";
import { EmptyState, ErrorState, Shimmer } from "@/components/states";
import { fetchStats, type Stats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { DIFFICULTY_LABEL } from "@/lib/labels";
import { useResource } from "@/lib/use-resource";

export default function PatronesPage() {
  const { timezone } = useAuth();
  const load = useCallback(() => fetchStats(), []);
  const {
    status,
    data: stats,
    error,
    reload,
  } = useResource(load, "No se pudo cargar el panel.");

  if (status === "error") {
    return (
      <Page>
        <ErrorState message={error} onRetry={reload} />
      </Page>
    );
  }

  if (!stats) {
    return (
      <Page busy>
        <div className="grid grid-cols-3 gap-3">
          <Shimmer className="h-24 rounded-lg" />
          <Shimmer className="h-24 rounded-lg" />
          <Shimmer className="h-24 rounded-lg" />
        </div>
        <Shimmer className="h-40 w-full rounded-lg" />
        <Shimmer className="h-52 w-full rounded-lg" />
      </Page>
    );
  }

  const { totals, streak, highlights } = stats;
  const closed = totals.completed + totals.failed + totals.rescheduled;

  if (totals.total === 0) {
    return (
      <Page>
        <EmptyState
          title="Todavía no hay patrones que mostrar"
          description="Analiza un compromiso, asúmelo y márcalo cuando llegue la hora. Con unos pocos ya empiezo a ver tu forma de cumplir."
          actionLabel="Analizar algo"
          actionHref="/"
          icon={<Target className="size-8" strokeWidth={1.4} />}
        />
      </Page>
    );
  }

  const best = bestRate(stats.by_hour_band);

  const bandRows: RateRow[] = stats.by_hour_band.map((band) => ({
    key: band.band,
    label: band.label,
    total: band.total,
    completed: band.completed,
    rate: band.rate,
    highlight: band.rate !== null && best !== null && band.rate === best,
  }));

  const difficultyRows: RateRow[] = stats.by_difficulty.map((slice) => ({
    key: slice.difficulty,
    label: DIFFICULTY_LABEL[slice.difficulty],
    total: slice.total,
    completed: slice.completed,
    rate: slice.rate,
  }));

  const categoryRows: RateRow[] = stats.by_category.slice(0, 6).map((slice) => ({
    key: slice.category,
    label: slice.category,
    total: slice.total,
    completed: slice.completed,
    rate: slice.rate,
  }));

  const recs = stats.recommendations;

  return (
    <Page>
      {/* Los tres números que resumen todo. */}
      <div className="grid grid-cols-3 divide-x divide-rule border-y border-rule">
        <Tile
          value={totals.completion_rate === null ? "—" : `${totals.completion_rate}%`}
          label="cumplimiento"
          hint={closed > 0 ? `${totals.completed} de ${closed}` : "sin cierres"}
        />
        <Tile
          value={String(streak.current)}
          label="racha"
          hint={`mejor: ${streak.best}`}
          icon={<Flame className="size-4 text-alert" />}
        />
        <Tile
          value={String(totals.pending)}
          label="pendientes"
          hint={`${totals.total} total`}
        />
      </div>

      {highlights.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="station text-ink-soft">Lo que veo en ti</h2>
          <ul className="flex flex-col gap-3">
            {highlights.map((highlight, index) => (
              <li
                key={highlight.type}
                className="flex gap-3.5 text-[17px] leading-[1.4]"
              >
                <span className="station shrink-0 pt-1.5 text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-display leading-[1.3]">
                  {highlight.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panel
        title="Tu mejor momento del día"
        description="Porcentaje que cumples en cada franja. Es la misma franja que uso al recomendarte una hora."
      >
        <RateBars rows={bandRows} />
      </Panel>

      <Panel title="Por día de la semana" description="Tasa de cumplimiento, de lunes a domingo.">
        <WeekdayBars data={stats.by_weekday} />
      </Panel>

      <Panel title="Cómo vas por semana">
        <TrendChart
          data={stats.trend}
          labelOf={(weekStart) =>
            formatShortDate(`${weekStart}T12:00:00Z`, timezone)
          }
        />
      </Panel>

      {/* La sección que responde "¿y esto funciona?". */}
      <Panel
        title="¿Acierto?"
        description="Cada tramo compara lo que predije con lo que de verdad pasó. Cuanto más parecidas las dos barras, mejor calibrado estoy."
      >
        <CalibrationChart data={stats.calibration} />
      </Panel>

      <Panel
        title="¿Sirven mis consejos?"
        description="Cuántas veces te propuse otra hora y qué pasó cuando me hiciste caso."
      >
        {recs.suggested === 0 ? (
          <p className="border-l-2 border-rule py-1 pl-4 text-[14px] leading-relaxed text-ink-soft">
            Todavía no te he propuesto ninguna hora alternativa.
          </p>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-rule border-y border-rule">
            <Tile
              value={`${recs.accepted}/${recs.suggested}`}
              label="aceptadas"
              hint="que te propuse"
            />
            <Tile
              value={String(recs.completed_when_accepted)}
              label="cumplidas tras aceptar"
              hint={`${recs.completed_when_ignored} si no`}
            />
          </div>
        )}
      </Panel>

      <Panel title="Por dificultad">
        <RateBars rows={difficultyRows} />
      </Panel>

      {categoryRows.length > 0 && (
        <Panel title="Por categoría">
          <RateBars rows={categoryRows} />
        </Panel>
      )}

      <p className="station pb-2 text-center leading-relaxed text-ink-faint">
        {totals.total} {totals.total === 1 ? "compromiso" : "compromisos"} · 12
        semanas · los borradores no cuentan
      </p>
    </Page>
  );
}

function Page({
  children,
  busy = false,
}: {
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-9 px-5 pt-9"
      aria-busy={busy || undefined}
    >
      <header className="flex flex-col gap-2">
        <p className="station text-ink-soft">tu registro</p>
        <h1 className="text-[34px] leading-[0.98] sm:text-[42px]">
          Tus patrones
        </h1>
        <p className="mt-1 max-w-[44ch] text-[15px] leading-[1.65] text-ink-mid">
          Lo que tu historial dice de ti, y qué tan bien acierto.
        </p>
      </header>
      {children}
    </div>
  );
}

function bestRate(bands: Stats["by_hour_band"]): number | null {
  const rates = bands
    .filter((band) => band.rate !== null && band.total > 0)
    .map((band) => band.rate!);
  return rates.length ? Math.max(...rates) : null;
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-7">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-[21px] leading-tight">{title}</h2>
        {description && (
          <p className="max-w-[52ch] text-[14px] leading-[1.6] text-ink-soft">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Un número que importa. Van en rejilla, separados por filetes. */
function Tile({
  value,
  label,
  hint,
  icon,
}: {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-4 first:pl-0">
      <span className="flex items-center gap-1.5">
        <span className="tnum font-display text-[30px] leading-none">
          {value}
        </span>
        {icon}
      </span>
      <span className="station mt-1 text-ink-mid">{label}</span>
      {hint && <span className="station text-ink-faint">{hint}</span>}
    </div>
  );
}
