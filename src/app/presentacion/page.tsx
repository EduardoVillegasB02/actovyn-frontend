"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Deck, Eyebrow, Lead, Points, Title } from "@/components/deck";
import { Verdict } from "@/components/verdict";
import { fetchStats, type Stats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/use-resource";

/**
 * La presentación del demoday, dentro de la propia aplicación.
 *
 * Está aquí y no en un Keynote por dos razones: un solo enlace para toda la
 * charla, y las láminas de resultados leen el API de verdad. Enseñar la
 * calibración con datos reales, en vivo, es lo que separa "esto predice" de
 * "esto funciona".
 */
export default function PresentacionPage() {
  const { user } = useAuth();
  const load = useCallback(() => fetchStats(), []);
  const { data: stats } = useResource(load);

  const slides = [
    <Portada key="portada" name={user?.display_name ?? ""} />,
    <LaFrase key="frase" />,
    <ElHueco key="hueco" />,
    <LaRespuesta key="respuesta" />,
    <ComoFunciona key="como" />,
    <ElTope key="tope" />,
    <DemoEnVivo key="demo" />,
    <Acierto key="acierto" stats={stats} />,
    <Arquitectura key="arquitectura" />,
    <QueSigue key="sigue" />,
    <Cierre key="cierre" />,
  ];

  return <Deck slides={slides} />;
}

/* ------------------------------------------------------------------ */

function Portada({ name }: { name: string }) {
  return (
    <div className="flex flex-col">
      <Eyebrow>estación de pronóstico</Eyebrow>
      <h1 className="font-display text-[clamp(52px,12vw,124px)] leading-[0.88] tracking-[-0.045em] text-slab-ink">
        ¿Lo vas a
        <br />
        cumplir?
      </h1>
      <p className="mt-10 text-[clamp(17px,2.4vw,24px)] leading-[1.5] text-slab-mid">
        Un agente que aprende de tu comportamiento para predecir qué tan
        realista es cada compromiso.
      </p>
      {name && (
        <p className="station mt-12 text-slab-soft">
          {name} · proyecto personal
        </p>
      )}
    </div>
  );
}

function LaFrase() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el punto de partida</Eyebrow>
      <blockquote className="font-display text-[clamp(30px,6.5vw,68px)] leading-[1.02] tracking-[-0.035em] text-slab-ink">
        “Mañana termino mi
        <br />
        informe a las 11pm.”
      </blockquote>
      <Lead>
        Todos la hemos dicho. Casi nunca pasa. Y lo peor es que, en el momento
        de decirlo, nos lo creemos.
      </Lead>
    </div>
  );
}

function ElHueco() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el hueco</Eyebrow>
      <Title>
        Las apps guardan tu plan.
        <br />
        Ninguna te dice si lo vas
        <br />a cumplir.
      </Title>
      <Lead>
        Calendarios, listas, rastreadores de hábitos. Todos registran la
        intención. El resultado real, el que importa, no se lo pregunta nadie.
      </Lead>
    </div>
  );
}

function LaRespuesta() {
  return (
    <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
      <div className="flex flex-col">
        <Eyebrow>la respuesta</Eyebrow>
        <Title>
          Un número,
          <br />y por qué.
        </Title>
        <Lead>
          Escribes el compromiso en lenguaje natural. Recibes la probabilidad de
          cumplirlo y los cinco factores que la sostienen, con cuántos registros
          respaldan cada uno.
        </Lead>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <Verdict score={39} risk="HIGH_RISK" confidence="MEDIUM" />
      </div>
    </div>
  );
}

function ComoFunciona() {
  return (
    <div className="flex flex-col">
      <Eyebrow>cómo funciona</Eyebrow>
      <Title>El modelo no inventa el número.</Title>
      <Points
        items={[
          <>
            El <strong className="text-[--accent-lit]">LLM solo extrae</strong>:
            objetivo, hora, categoría y dificultad del texto que escribiste.
          </>,
          <>
            El score sale de una{" "}
            <strong className="text-[--accent-lit]">regla propia</strong> sobre
            tu historial, con pesos fijos y auditables.
          </>,
          <>
            Cinco factores: cumplimiento histórico, compatibilidad de horario,
            ajuste a la dificultad, consistencia reciente y firmeza del
            lenguaje.
          </>,
          <>
            Si le preguntas dos veces lo mismo, responde lo mismo. Un LLM que
            puntúa directamente, no.
          </>,
        ]}
      />
    </div>
  );
}

function ElTope() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el detalle que lo hace honesto</Eyebrow>
      <Title>
        Cuando la evidencia
        <br />
        está en contra, topa.
      </Title>
      <Lead>
        Si en tu franja de las 11pm cumples el 20% sobre doce registros, ningún
        promedio bonito debería rescatar ese número. Ese factor limita el score
        y la interfaz lo marca en rojo, con el conteo de registros a la vista.
      </Lead>
      <p className="mt-9 border-l-2 border-[#fb7185] pl-5 text-[clamp(16px,2vw,20px)] leading-[1.5] text-slab-mid">
        Prefiero un agente que diga{" "}
        <span className="text-slab-ink">“esto no te va a salir, y aquí está el porqué”</span>{" "}
        antes que uno que motive.
      </p>
    </div>
  );
}

function DemoEnVivo() {
  return (
    <div className="flex flex-col items-start">
      <Eyebrow>ahora en vivo</Eyebrow>
      <h2 className="font-display text-[clamp(60px,15vw,150px)] leading-[0.85] tracking-[-0.05em] text-slab-ink">
        Demo
      </h2>
      <Lead>
        Analizar un compromiso, ver por qué el score es bajo, mover la hora a la
        que sugiere y ver el número subir en vivo.
      </Lead>
      <Link
        href="/"
        className="group mt-10 inline-flex items-center gap-3 rounded-lg bg-slab-ink px-6 py-4 font-display text-[19px] text-slab transition-colors hover:bg-[--accent-lit]"
      >
        Abrir la aplicación
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

/** La lámina que responde "¿y esto funciona?", con datos reales. */
function Acierto({ stats }: { stats: Stats | null }) {
  const buckets = (stats?.calibration ?? []).filter((bucket) => bucket.n > 0);
  const totals = stats?.totals;

  return (
    <div className="flex flex-col">
      <Eyebrow>¿y esto funciona?</Eyebrow>
      <Title>Lo que predije, frente a lo que pasó.</Title>

      {buckets.length === 0 ? (
        <Lead>
          Cargando tus datos reales… Si no aparecen, el panel de patrones tiene
          esta misma comparación.
        </Lead>
      ) : (
        <>
          <p className="mt-7 max-w-[44ch] text-[clamp(15px,1.9vw,19px)] leading-[1.5] text-slab-mid">
            Datos reales de esta cuenta, leídos del API en este momento. Cuanto
            más se parecen las dos cifras, mejor calibrado está el motor.
          </p>

          <ul className="mt-9 flex flex-col">
            {buckets.map((bucket) => (
              <li
                key={bucket.bucket}
                className="flex items-center gap-4 border-t border-slab-rule py-4 sm:gap-8"
              >
                <span className="station w-24 shrink-0 text-slab-soft sm:w-32">
                  dije {bucket.bucket}
                </span>
                <span className="flex flex-1 items-baseline gap-3 sm:gap-6">
                  <Figure value={bucket.predicted_avg} caption="predicho" />
                  <span aria-hidden="true" className="text-slab-rule">
                    →
                  </span>
                  <Figure value={bucket.actual_rate} caption="real" accent />
                </span>
                <span className="station tnum shrink-0 text-slab-soft">
                  n={bucket.n}
                </span>
              </li>
            ))}
          </ul>

          {totals && (
            <p className="station mt-7 text-slab-soft">
              {totals.completed + totals.failed + totals.rescheduled}{" "}
              compromisos cerrados · tasa global {totals.completion_rate}%
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Figure({
  value,
  caption,
  accent = false,
}: {
  value: number;
  caption: string;
  accent?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span
        className="tnum font-display text-[clamp(26px,4vw,40px)] leading-none"
        style={{ color: accent ? "#0bbccf" : "var(--slab-mid)" }}
      >
        {value}%
      </span>
      <span className="station hidden text-slab-soft sm:inline">{caption}</span>
    </span>
  );
}

function Arquitectura() {
  return (
    <div className="flex flex-col">
      <Eyebrow>cómo está construido</Eyebrow>
      <Title>Separar analizar de comprometerse.</Title>
      <Points
        items={[
          <>
            Analizar crea un{" "}
            <strong className="text-[--accent-lit]">borrador</strong>. No entra
            al historial ni al motor hasta que dices “me comprometo”.
          </>,
          <>
            Sin eso, probar la app la ensucia: cada prueba contaminaría los
            datos con los que aprende.
          </>,
          <>
            Backend en NestJS con arquitectura hexagonal, Prisma y Postgres. El
            dominio no conoce HTTP ni el proveedor de IA.
          </>,
          <>
            Frontend en Next.js con App Router. La API se sirve desde el mismo
            origen para que la sesión sobreviva en cualquier navegador.
          </>,
        ]}
      />
    </div>
  );
}

function QueSigue() {
  return (
    <div className="flex flex-col">
      <Eyebrow>qué sigue</Eyebrow>
      <Title>De un agente a varios.</Title>
      <Points
        items={[
          <>
            Recordatorios push antes de la hora, y un “¿lo cumpliste?” después.
            Sin eso, la mitad de los pendientes nunca se cierran.
          </>,
          <>
            Un agente que negocie la hora directamente con tu calendario en vez
            de sugerirte un texto.
          </>,
          <>
            Y entonces la pregunta interesante: quién decide cuando el agente
            del calendario y el del pronóstico no están de acuerdo.
          </>,
        ]}
      />
    </div>
  );
}

function Cierre() {
  return (
    <div className="flex flex-col items-start">
      <Eyebrow>gracias</Eyebrow>
      <h2 className="font-display text-[clamp(44px,10vw,104px)] leading-[0.9] tracking-[-0.04em] text-slab-ink">
        ¿Lo vas a
        <br />
        cumplir?
      </h2>
      <p className="mt-10 max-w-[40ch] text-[clamp(17px,2.4vw,24px)] leading-[1.5] text-slab-mid">
        Pruébalo ahora mismo. Entras como invitado, sin formulario, y el primer
        pronóstico tarda diez segundos.
      </p>
      <Link
        href="/"
        className="group mt-9 inline-flex items-center gap-3 rounded-lg bg-slab-ink px-6 py-4 font-display text-[19px] text-slab transition-colors hover:bg-[--accent-lit]"
      >
        Probarlo
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
