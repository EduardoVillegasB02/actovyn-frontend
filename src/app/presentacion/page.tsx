"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Deck, Eyebrow, Lead, Points, Title, type Slide } from "@/components/deck";
import { Verdict } from "@/components/verdict";
import { fetchStats, type Stats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SPEAKER, initialsOf } from "@/lib/speaker";
import { useResource } from "@/lib/use-resource";

/**
 * La presentación del demoday, dentro de la propia aplicación.
 *
 * Está aquí y no en un Keynote por dos razones: un solo enlace para toda la
 * charla, y las láminas de resultados leen el API de verdad. Enseñar la
 * calibración con datos reales, en vivo, es lo que separa "esto predice" de
 * "esto funciona".
 *
 * Veinticinco láminas para veinte minutos: unos cuarenta segundos cada una,
 * dejando cuatro minutos para la demo. Las notas se abren con la tecla n.
 */
export default function PresentacionPage() {
  const { user } = useAuth();
  const load = useCallback(() => fetchStats(), []);
  const { data: stats } = useResource(load);

  const slides: Slide[] = [
    {
      content: <Portada />,
      notes:
        "Espera a que la sala se calle. Di el título en voz alta, como pregunta, y deja dos segundos de silencio antes de seguir.",
    },
    {
      content: <QuienSoy />,
      notes:
        "Veinte segundos, no más. Quién eres y por qué construiste esto tú solo. El proyecto es el protagonista, no el currículum.",
    },
    {
      content: <LaFrase />,
      notes:
        "Pregunta a la sala quién dijo algo así esta semana. Levanta tú la mano primero. Es el momento de complicidad de toda la charla.",
    },
    {
      content: <ElAutoengano />,
      notes:
        "La clave: no mentimos, nos lo creemos. Somos malos prediciendo nuestro propio comportamiento y encima no llevamos la cuenta de cuánto fallamos.",
    },
    {
      content: <ElHueco />,
      notes:
        "Nombra apps que todos conozcan. Todas guardan la intención. Ninguna te pregunta después qué pasó de verdad.",
    },
    {
      content: <LoQueNoQueria />,
      notes:
        "Marca distancia del coach motivacional. Esto no te anima: te dice la probabilidad y te enseña los datos. Es una diferencia de producto, no de tono.",
    },
    {
      content: <LaRespuesta />,
      notes:
        "Señala el número y luego el arco. Un dato y su porqué. Aquí ya se entiende el producto entero.",
    },
    {
      content: <LosCincoFactores />,
      notes:
        "No leas los cinco. Di dos y menciona que cada uno lleva cuántos registros lo respaldan, que es lo que lo hace auditable.",
    },
    {
      content: <ElTope />,
      notes:
        "La lámina más importante de la parte técnica. Un promedio puede esconder una señal fuerte en contra; el tope impide que eso pase.",
    },
    {
      content: <PorQueNoElLlm />,
      notes:
        "Si preguntas dos veces lo mismo a un LLM, no siempre responde igual. Para un número que la gente va a creerse, eso es inaceptable.",
    },
    {
      content: <QueHaceElLlm />,
      notes:
        "El modelo hace lo que hace bien: entender lenguaje. Extrae objetivo, hora y dificultad. La aritmética es mía.",
    },
    {
      content: <ElBorrador />,
      notes:
        "Cuenta el bug real: al principio, cada prueba creaba un compromiso y contaminaba el historial del que aprende el motor. DRAFT lo resolvió.",
    },
    {
      content: <ElCiclo />,
      notes:
        "El bucle cerrado es lo que lo hace mejorar. Sin el cierre no hay aprendizaje, solo opiniones.",
    },
    {
      content: <DemoEnVivo />,
      notes:
        "Cuatro minutos. Analiza, enseña el factor topado, acepta la hora sugerida y deja que vean el número subir. Si el backend falla, pasa a la siguiente y cuéntalo con capturas.",
    },
    {
      content: <Acierto stats={stats} />,
      notes:
        "Datos reales, leídos ahora. Di en voz alta el tramo que mejor coincida. Esta lámina responde la pregunta que todos tienen.",
    },
    {
      content: <TusPatrones stats={stats} />,
      notes:
        "El valor para el usuario, no para el ingeniero: descubrir que a las 11pm no cumples nunca y a las 7pm casi siempre.",
    },
    {
      content: <Arquitectura />,
      notes:
        "Rápido. Hexagonal para que el dominio no sepa de HTTP ni del proveedor de IA. Cambiar OpenAI por otro es cambiar un adaptador.",
    },
    {
      content: <LaCookie />,
      notes:
        "Un detalle pequeño con consecuencia grande: la sesión moría en Safari. Cuenta cómo lo descubriste, da credibilidad.",
    },
    {
      content: <ElDiseno />,
      notes:
        "Dos mundos: losa oscura para el veredicto, papel para la evidencia. El contraste es la jerarquía. Una frase y sigue.",
    },
    {
      content: <LoQueSalioMal />,
      notes:
        "Sé honesto. Una charla sin errores no se cree. Esta lámina es la que te gana a la sala.",
    },
    {
      content: <Numeros />,
      notes:
        "Los números del proyecto. No te recrees, es contexto de esfuerzo, no el punto.",
    },
    {
      content: <QueSigue />,
      notes:
        "Aterriza en la pregunta de varios agentes en desacuerdo. Si el evento va de sistemas multiagente, este es tu puente.",
    },
    {
      content: <Codigo />,
      notes:
        "Deja esta lámina unos segundos de más: es la que la gente fotografía. Di en voz alta que el motor de score se puede leer entero, que es lo que respalda todo lo que acabas de contar.",
    },
    {
      content: <Cierre />,
      notes:
        "Repite el título como pregunta. Invita a probarlo ahí mismo: entrar como invitado toma diez segundos.",
    },
    {
      content: <Preguntas />,
      notes:
        "Deja esta lámina puesta. Tus datos quedan a la vista mientras respondes.",
    },
  ];

  void user;
  return <Deck slides={slides} />;
}

/* ------------------------------------------------------------------ */
/* Apertura                                                            */
/* ------------------------------------------------------------------ */

function Portada() {
  return (
    <div className="flex flex-col">
      <Eyebrow>estación de pronóstico</Eyebrow>
      <h1 className="font-display text-[clamp(52px,12vw,124px)] leading-[0.88] tracking-[-0.045em] text-slab-ink">
        ¿Lo vas a
        <br />
        cumplir?
      </h1>
      <p className="mt-10 max-w-[44ch] text-[clamp(17px,2.4vw,24px)] leading-[1.5] text-slab-mid">
        Un agente que aprende de tu comportamiento para predecir qué tan
        realista es cada compromiso.
      </p>
      <p className="station mt-12 text-slab-soft">
        {SPEAKER.name} · {SPEAKER.role}
      </p>
    </div>
  );
}

function QuienSoy() {
  return (
    <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:gap-12">
      <SpeakerPhoto />
      <div className="flex min-w-0 flex-col">
        <Eyebrow>quién habla</Eyebrow>
        <h2 className="font-display text-[clamp(32px,6vw,58px)] leading-[0.98] tracking-[-0.035em] text-slab-ink">
          {SPEAKER.name}
        </h2>
        <p className="mt-4 text-[clamp(16px,2.2vw,21px)] leading-[1.5] text-slab-mid">
          {SPEAKER.role}
        </p>
        <p className="mt-6 max-w-[40ch] text-[clamp(15px,2vw,19px)] leading-[1.55] text-slab-mid">
          Esto lo construí solo, de punta a punta, porque el problema me pasaba
          a mí.
        </p>
        <SpeakerLinks />
      </div>
    </div>
  );
}

function SpeakerPhoto({ size = 200 }: { size?: number }) {
  const [broken, setBroken] = useState(false);

  if (!SPEAKER.photo || broken) {
    return (
      <div
        className="grid shrink-0 place-items-center rounded-2xl border border-slab-rule bg-slab-2 font-display text-[clamp(34px,7vw,58px)] text-slab-soft"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {initialsOf(SPEAKER.name)}
      </div>
    );
  }

  return (
    // Sin next/image a propósito: si el archivo no está, esto degrada a las
    // iniciales en vez de romper la lámina en pleno escenario.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SPEAKER.photo}
      alt={SPEAKER.name}
      width={size}
      height={size}
      onError={() => setBroken(true)}
      className="shrink-0 rounded-2xl border border-slab-rule object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function SpeakerLinks({ className = "mt-8" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-7 gap-y-3 ${className}`}>
      {SPEAKER.links.map((link) => (
        <li key={link.label} className="flex flex-col">
          <span className="station text-slab-soft">{link.label}</span>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-[clamp(15px,1.9vw,18px)] text-slab-ink underline decoration-slab-rule underline-offset-4 transition-colors hover:text-[--accent-lit]"
          >
            {link.handle}
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* El problema                                                         */
/* ------------------------------------------------------------------ */

function LaFrase() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el punto de partida</Eyebrow>
      <blockquote className="font-display text-[clamp(30px,6.5vw,68px)] leading-[1.02] tracking-[-0.035em] text-slab-ink">
        “Mañana termino mi
        <br />
        informe a las 11pm.”
      </blockquote>
      <Lead>¿Quién dijo algo así esta semana?</Lead>
    </div>
  );
}

function ElAutoengano() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el problema de fondo</Eyebrow>
      <Title>No mentimos. Nos lo creemos.</Title>
      <Points
        items={[
          <>
            Somos pésimos prediciendo nuestro propio comportamiento, y aún peor
            recordando cuántas veces fallamos.
          </>,
          <>
            Nadie lleva la cuenta de a qué hora cumple y a qué hora no. Esa
            estadística existe, pero está en tu cabeza y está sesgada.
          </>,
          <>
            Sin ese registro, cada promesa se hace a ciegas y con exceso de
            confianza.
          </>,
        ]}
      />
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

function LoQueNoQueria() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
      <div className="flex flex-col">
        <p className="station mb-5 text-[#fb7185]">lo que no quería</p>
        <ul className="flex flex-col gap-4 text-[clamp(16px,2.1vw,21px)] leading-[1.4] text-slab-soft">
          <li>“¡Tú puedes!”</li>
          <li>Rachas y medallas</li>
          <li>Un número sin explicación</li>
          <li>Culpa por fallar</li>
        </ul>
      </div>
      <div className="flex flex-col border-slab-rule sm:border-l sm:pl-12">
        <p className="station mb-5 text-[#4ade80]">lo que quería</p>
        <ul className="flex flex-col gap-4 text-[clamp(16px,2.1vw,21px)] leading-[1.4] text-slab-ink">
          <li>“Aquí cumples el 20%.”</li>
          <li>Evidencia con su conteo</li>
          <li>Una hora mejor, concreta</li>
          <li>Datos, no ánimo</li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* La solución                                                         */
/* ------------------------------------------------------------------ */

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
          Escribes el compromiso como se lo dirías a alguien. Recibes la
          probabilidad de cumplirlo, los factores que la sostienen y una hora
          alternativa.
        </Lead>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <Verdict score={39} risk="HIGH_RISK" confidence="MEDIUM" />
      </div>
    </div>
  );
}

function LosCincoFactores() {
  const factors = [
    ["Cumplimiento histórico", "35%", "Con qué frecuencia cumples"],
    ["Compatibilidad de horario", "25%", "Qué tal te va a esa hora"],
    ["Ajuste a la dificultad", "20%", "Cómo te fue con tareas así"],
    ["Consistencia reciente", "10%", "Tu racha de estas semanas"],
    ["Firmeza del lenguaje", "10%", "Qué tan firme suena"],
  ];

  return (
    <div className="flex flex-col">
      <Eyebrow>anatomía del número</Eyebrow>
      <Title>Cinco factores, pesos fijos.</Title>
      <ul className="mt-9 flex flex-col">
        {factors.map(([name, weight, hint]) => (
          <li
            key={name}
            className="flex items-baseline gap-4 border-t border-slab-rule py-3.5 sm:gap-8"
          >
            <span className="tnum w-14 shrink-0 font-display text-[clamp(20px,2.6vw,28px)] leading-none text-[--accent-lit]">
              {weight}
            </span>
            <span className="min-w-0 flex-1 text-[clamp(16px,2vw,21px)] leading-tight text-slab-ink">
              {name}
            </span>
            <span className="station hidden shrink-0 text-slab-soft lg:block">
              {hint}
            </span>
          </li>
        ))}
      </ul>
      <p className="station mt-6 text-slab-soft">
        cada uno muestra cuántos registros lo respaldan
      </p>
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
        y la interfaz lo marca en rojo, con el conteo a la vista.
      </Lead>
      <p className="mt-9 border-l-2 border-[#fb7185] pl-5 text-[clamp(16px,2vw,21px)] leading-[1.45] text-slab-mid">
        Prefiero un agente que diga{" "}
        <span className="text-slab-ink">
          “esto no te va a salir, y aquí está el porqué”
        </span>{" "}
        antes que uno que motive.
      </p>
    </div>
  );
}

function PorQueNoElLlm() {
  return (
    <div className="flex flex-col">
      <Eyebrow>la decisión técnica</Eyebrow>
      <Title>El modelo no pone el número.</Title>
      <Points
        items={[
          <>
            Si le preguntas dos veces lo mismo, no siempre responde igual. Para
            una cifra que la gente se va a creer, eso no sirve.
          </>,
          <>
            Un score que sale de un modelo no se puede auditar: no hay a qué
            apuntar cuando alguien pregunta por qué le salió 39.
          </>,
          <>
            Y no se puede mejorar con datos. Una regla con pesos sí: la mides
            contra la realidad y la ajustas.
          </>,
        ]}
      />
    </div>
  );
}

function QueHaceElLlm() {
  return (
    <div className="grid gap-9 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-12">
      <div className="flex flex-col gap-4">
        <p className="station text-slab-soft">entra</p>
        <p className="max-w-[22ch] font-display text-[clamp(19px,2.6vw,27px)] leading-[1.2] text-slab-ink">
          “Mañana termino mi informe a las 11pm”
        </p>
      </div>
      <div className="flex flex-col border-slab-rule sm:border-l sm:pl-12">
        <p className="station mb-4 text-[--accent-lit]">sale</p>
        <ul className="flex flex-col gap-2.5 font-mono text-[clamp(14px,1.8vw,17px)] text-slab-ink">
          <li>
            objetivo: <span className="text-slab-mid">terminar mi informe</span>
          </li>
          <li>
            hora: <span className="text-slab-mid">mañana 23:00</span>
          </li>
          <li>
            categoría: <span className="text-slab-mid">trabajo</span>
          </li>
          <li>
            dificultad: <span className="text-slab-mid">media</span>
          </li>
        </ul>
        <p className="mt-7 max-w-[34ch] text-[clamp(15px,1.9vw,19px)] leading-[1.5] text-slab-mid">
          El modelo hace lo que hace bien: entender lenguaje. La aritmética es
          mía.
        </p>
      </div>
    </div>
  );
}

function ElBorrador() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el bug que cambió el diseño</Eyebrow>
      <Title>Analizar no es comprometerse.</Title>
      <Points
        items={[
          <>
            Al principio, cada análisis creaba un compromiso. Probar la app
            ensuciaba el historial del que aprende el motor.
          </>,
          <>
            Ahora analizar crea un{" "}
            <strong className="text-[--accent-lit]">borrador</strong>: no entra
            al historial, ni a las estadísticas, ni al modelo.
          </>,
          <>
            Solo cuando pulsas “me comprometo” pasa a contar. Y un proceso borra
            los borradores viejos cada hora.
          </>,
        ]}
      />
    </div>
  );
}

function ElCiclo() {
  const steps = ["Escribes", "Predigo", "Actúas", "Marcas qué pasó", "Aprendo"];
  return (
    <div className="flex flex-col">
      <Eyebrow>el bucle</Eyebrow>
      <Title>Sin el cierre no hay aprendizaje.</Title>
      <ol className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-4">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`font-display text-[clamp(17px,2.4vw,25px)] leading-none ${
                index === 3 ? "text-[--accent-lit]" : "text-slab-ink"
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <ArrowRight
                className="size-4 shrink-0 text-slab-soft"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
      <Lead>
        El cuarto paso es el que casi ninguna app pide, y es el único que
        convierte una opinión en un dato.
      </Lead>
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

/* ------------------------------------------------------------------ */
/* Resultados, con datos reales                                        */
/* ------------------------------------------------------------------ */

function Acierto({ stats }: { stats: Stats | null }) {
  const buckets = (stats?.calibration ?? []).filter((bucket) => bucket.n > 0);
  const totals = stats?.totals;

  return (
    <div className="flex flex-col">
      <Eyebrow>¿y esto funciona?</Eyebrow>
      <Title>Lo que predije, frente a lo que pasó.</Title>

      {buckets.length === 0 ? (
        <Lead>
          Leyendo tus datos… Si no aparecen, el panel de patrones tiene esta
          misma comparación.
        </Lead>
      ) : (
        <>
          <p className="mt-6 max-w-[46ch] text-[clamp(15px,1.9vw,19px)] leading-[1.5] text-slab-mid">
            Datos reales de esta cuenta, leídos del API en este momento. Cuanto
            más se parecen las dos cifras, mejor calibrado está el motor.
          </p>

          <ul className="mt-8 flex flex-col">
            {buckets.map((bucket) => (
              <li
                key={bucket.bucket}
                className="flex items-center gap-4 border-t border-slab-rule py-3.5 sm:gap-8"
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
            <p className="station mt-6 text-slab-soft">
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

function TusPatrones({ stats }: { stats: Stats | null }) {
  const bands = (stats?.by_hour_band ?? []).filter(
    (band) => band.rate !== null && band.total > 0,
  );
  const best = [...bands].sort((a, b) => b.rate! - a.rate!)[0];
  const worst = [...bands].sort((a, b) => a.rate! - b.rate!)[0];

  return (
    <div className="flex flex-col">
      <Eyebrow>lo que gana el usuario</Eyebrow>
      <Title>Descubres algo de ti.</Title>

      {best && worst && best.band !== worst.band ? (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-12">
          <BandFigure
            label="tu mejor franja"
            band={best.label}
            rate={best.rate!}
            total={best.total}
            color="#4ade80"
          />
          <BandFigure
            label="tu peor franja"
            band={worst.label}
            rate={worst.rate!}
            total={worst.total}
            color="#fb7185"
          />
        </div>
      ) : (
        <Lead>
          Con unas semanas de uso aparecen tus franjas buenas y malas, tu peor
          día de la semana y tu racha.
        </Lead>
      )}

      <p className="mt-10 max-w-[44ch] text-[clamp(15px,1.9vw,19px)] leading-[1.55] text-slab-mid">
        Nadie sabe esto de sí mismo. Sale solo de cerrar compromisos durante
        unas semanas.
      </p>
    </div>
  );
}

function BandFigure({
  label,
  band,
  rate,
  total,
  color,
}: {
  label: string;
  band: string;
  rate: number;
  total: number;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <p className="station mb-3" style={{ color }}>
        {label}
      </p>
      <p className="font-display text-[clamp(30px,5vw,46px)] leading-none text-slab-ink">
        {band}
      </p>
      <p
        className="tnum mt-4 font-display text-[clamp(40px,7vw,64px)] leading-none"
        style={{ color }}
      >
        {rate}%
      </p>
      <p className="station mt-3 text-slab-soft">sobre {total} registros</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cómo está hecho                                                     */
/* ------------------------------------------------------------------ */

function Arquitectura() {
  return (
    <div className="flex flex-col">
      <Eyebrow>cómo está construido</Eyebrow>
      <Title>El dominio no sabe de HTTP ni de IA.</Title>
      <Points
        items={[
          <>
            Backend en NestJS con arquitectura hexagonal. Prisma y Postgres
            detrás de un puerto, no esparcidos por el código.
          </>,
          <>
            El proveedor de IA es un adaptador. Cambiar OpenAI por otro no toca
            ni una línea del dominio.
          </>,
          <>
            El motor de score es una clase pura con pruebas: se testea con un
            array, sin base de datos.
          </>,
          <>
            Frontend en Next.js con App Router, TypeScript estricto y un solo
            cliente HTTP tipado contra el contrato.
          </>,
        ]}
      />
    </div>
  );
}

function LaCookie() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el detalle que casi se me escapa</Eyebrow>
      <Title>La sesión moría en Safari.</Title>
      <Points
        items={[
          <>
            El refresh token viaja en una cookie httpOnly. Con la web y la API
            en dominios distintos, es una cookie de terceros.
          </>,
          <>
            Safari y Brave las bloquean. El usuario entra, recarga y aparece
            deslogueado, sin ningún error en consola.
          </>,
          <>
            La solución: servir la API desde el mismo origen con un proxy. La
            cookie vuelve a ser de primera parte y CORS desaparece.
          </>,
        ]}
      />
    </div>
  );
}

function ElDiseno() {
  return (
    <div className="flex flex-col">
      <Eyebrow>por qué se ve así</Eyebrow>
      <Title>Dos mundos que conviven.</Title>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-12">
        <div className="flex flex-col">
          <p className="station mb-4 text-slab-soft">la losa</p>
          <p className="text-[clamp(16px,2.1vw,21px)] leading-[1.45] text-slab-ink">
            Casi negra, a sangre. Es el instrumento. Ahí vive el veredicto y
            nada más, y el color lo pone el riesgo.
          </p>
        </div>
        <div className="flex flex-col border-slab-rule sm:border-l sm:pl-12">
          <p className="station mb-4 text-slab-soft">el papel</p>
          <p className="text-[clamp(16px,2.1vw,21px)] leading-[1.45] text-slab-ink">
            Hueso, con filetes finos en vez de tarjetas. Ahí vive la evidencia,
            en filas, para leerse.
          </p>
        </div>
      </div>
      <Lead>El contraste entre los dos es toda la jerarquía.</Lead>
    </div>
  );
}

function LoQueSalioMal() {
  return (
    <div className="flex flex-col">
      <Eyebrow>honestidad</Eyebrow>
      <Title>Lo que salió mal.</Title>
      <Points
        items={[
          <>
            Probar la app contaminaba sus propios datos. Lo resolvió separar el
            borrador del compromiso.
          </>,
          <>
            El primer score lo daba el modelo. Con la misma frase daba números
            distintos, así que lo reemplacé por una regla auditable.
          </>,
          <>
            Asumí que todos estaban en Lima. La hora local salía mal para
            cualquiera fuera del país, y el motor aprendía franjas equivocadas.
          </>,
        ]}
      />
    </div>
  );
}

function Numeros() {
  const figures = [
    ["18", "endpoints"],
    ["7", "pantallas"],
    ["5", "factores"],
    ["0", "librerías de estado"],
  ];
  return (
    <div className="flex flex-col">
      <Eyebrow>el proyecto en cifras</Eyebrow>
      <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
        {figures.map(([value, label]) => (
          <li key={label} className="flex flex-col gap-3">
            <span className="tnum font-display text-[clamp(44px,8vw,80px)] leading-none text-slab-ink">
              {value}
            </span>
            <span className="station text-slab-soft">{label}</span>
          </li>
        ))}
      </ul>
      <Lead>
        Sin Redux, sin librerías de fechas y sin modo oscuro. Cada cosa que no
        está es una decisión, no un olvido.
      </Lead>
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

function Codigo() {
  return (
    <div className="flex flex-col">
      <Eyebrow>el código está abierto</Eyebrow>
      <Title>Míralo tú mismo.</Title>
      <ul className="mt-10 flex flex-col">
        {SPEAKER.repos.map((repo) => (
          <li key={repo.handle} className="border-t border-slab-rule">
            <a
              href={repo.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-4 py-5"
            >
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="font-display text-[clamp(21px,3.2vw,34px)] leading-none text-slab-ink transition-colors group-hover:text-[--accent-lit]">
                  {repo.handle}
                </span>
                <span className="station text-slab-soft">{repo.label}</span>
              </span>
              <ArrowRight
                className="size-5 shrink-0 text-slab-soft transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
      <Lead>
        El motor que calcula el score es una clase pura con pruebas. Se puede
        leer entero en una sentada, y esa es la idea.
      </Lead>
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
      <p className="mt-9 max-w-[40ch] text-[clamp(17px,2.4vw,24px)] leading-[1.5] text-slab-mid">
        Pruébalo ahora mismo. Entras como invitado, sin formulario, y el primer
        pronóstico tarda diez segundos.
      </p>
      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-3 rounded-lg bg-slab-ink px-6 py-4 font-display text-[19px] text-slab transition-colors hover:bg-[--accent-lit]"
      >
        Probarlo
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function Preguntas() {
  return (
    <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:gap-12">
      <SpeakerPhoto size={168} />
      <div className="flex min-w-0 flex-col">
        <h2 className="font-display text-[clamp(38px,8vw,80px)] leading-[0.95] tracking-[-0.04em] text-slab-ink">
          Preguntas
        </h2>
        <p className="station mt-5 text-slab-soft">{SPEAKER.name}</p>
        <SpeakerLinks className="mt-7" />
      </div>
    </div>
  );
}
