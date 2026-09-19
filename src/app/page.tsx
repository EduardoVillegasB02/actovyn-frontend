"use client";

import { useCallback, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { ErrorState, Shimmer } from "@/components/states";
import { StatusChip } from "@/components/intention-row";
import { intentions, ApiError, type Intention } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelative } from "@/lib/format";
import { saveDraft } from "@/lib/draft-store";
import { useResource } from "@/lib/use-resource";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "Mañana termino mi informe a las 11pm";
const MIN = 3;
const MAX = 500;

/** Ejemplos que enseñan el formato sin explicarlo. */
const EXAMPLES = [
  "Mañana termino mi informe a las 11pm",
  "El viernes salgo a correr a las 6am",
  "Hoy llamo a mamá a las 8pm",
];

export default function AnalizarPage() {
  const router = useRouter();
  const { user, timezone } = useAuth();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const canSubmit = trimmed.length >= MIN && trimmed.length <= MAX && !loading;

  const analyze = useCallback(
    async (text: string) => {
      const value = text.trim();
      if (value.length < MIN || value.length > MAX) return;
      setLoading(true);
      setError(null);
      try {
        const result = await intentions.analyze(value);
        saveDraft({ message: value, result, previousScore: null });
        router.push("/resultado");
      } catch (e) {
        setError(
          e instanceof ApiError ? e.message : "Ocurrió un error inesperado.",
        );
        setLoading(false);
      }
    },
    [router],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void analyze(message);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void analyze(message);
    }
  }

  const firstName = user && !user.is_guest ? user.name.split(" ")[0] : "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 pt-9">
      <header className="flex flex-col gap-3">
        <p className="station text-ink-soft">
          {firstName ? `estación de ${firstName}` : "estación de pronóstico"}
        </p>
        <h1 className="text-[38px] leading-[0.98] sm:text-[52px]">
          ¿Qué planeas
          <br />
          hacer?
        </h1>
        <p className="max-w-[46ch] text-[15px] leading-[1.65] text-ink-mid">
          Escríbelo con día y hora, como se lo dirías a alguien. Leo tu
          historial y te digo qué tan probable es que lo cumplas, y por qué.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col">
        {/* El campo es una hoja, no una caja: el filete grueso abajo es el foco. */}
        <div
          className={cn(
            "relative border-b-2 pb-2 transition-colors",
            loading ? "border-accent-ink" : "border-ink focus-within:border-accent-ink",
          )}
        >
          <label htmlFor="message" className="sr-only">
            ¿Qué planeas hacer?
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={PLACEHOLDER}
            disabled={loading}
            rows={3}
            maxLength={MAX}
            autoFocus
            className="w-full resize-none bg-transparent font-display text-[26px] leading-[1.22] tracking-[-0.02em] text-ink outline-none placeholder:text-ink-faint disabled:opacity-60 sm:text-[30px]"
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <span className="station hidden text-ink-faint sm:inline">
            enter envía · shift+enter salta línea
          </span>
          <span className="station text-ink-faint sm:hidden">
            toca analizar al terminar
          </span>
          <span className="station tnum text-ink-faint" aria-live="polite">
            {trimmed.length}/{MAX}
          </span>
        </div>

        {!trimmed && !loading && (
          <div className="mt-6 flex flex-col gap-2.5">
            <p className="station text-ink-faint">o prueba con</p>
            <ul className="flex flex-col gap-2">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => setMessage(example)}
                    className="group flex w-full items-center justify-between gap-3 rounded-md border border-rule bg-paper-2 px-3.5 py-2.5 text-left text-sm text-ink-mid transition-colors hover:border-ink hover:text-ink"
                  >
                    {example}
                    <ArrowRight className="size-3.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <ErrorState
            message={error}
            onRetry={() => void analyze(message)}
            className="mt-5"
          />
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="group mt-7 flex w-full items-center justify-between gap-3 rounded-lg bg-ink px-5 py-[18px] text-left text-paper transition-colors hover:bg-accent-ink disabled:bg-ink/25 disabled:text-paper/60"
        >
          <span className="flex flex-col">
            <span className="font-display text-[19px] leading-tight">
              {loading ? "Consultando tu historial…" : "Analizar"}
            </span>
            {!loading && (
              <span className="station mt-1 text-white/45 group-disabled:text-white/40">
                sin compromiso todavía
              </span>
            )}
          </span>
          {loading ? (
            <Loader2 className="size-5 shrink-0 animate-spin" />
          ) : (
            <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>

      <CheckInPanel timezone={timezone} />
    </div>
  );
}

/**
 * Lo que quedó pendiente y ya debería haber pasado.
 *
 * Cierra el ciclo: sin este recordatorio la mitad de los pendientes nunca se
 * marcan, y el motor se queda sin realidad con la que aprender.
 */
function CheckInPanel({ timezone }: { timezone: string }) {
  const load = useCallback(
    () =>
      intentions.list({
        status: ["PENDING"],
        scheduled_before: new Date().toISOString(),
        sort: "scheduled_at",
        order: "asc",
        limit: 3,
      }),
    [],
  );
  const { status, data } = useResource(load);

  if (status === "loading") return <Shimmer className="h-24 w-full rounded-lg" />;

  const items: Intention[] = data?.items ?? [];
  if (status === "error" || items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="station text-ink-soft">Su hora ya pasó</h2>
        <Link
          href="/historial?tab=pendientes"
          className="station inline-flex items-center gap-1 text-accent-ink hover:underline"
        >
          ver todo
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <ul className="flex flex-col">
        {items.map((item, index) => (
          <li key={item.id} className={index > 0 ? "border-t border-rule" : ""}>
            <Link
              href={`/historial/${item.id}`}
              className="group flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-70"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium">
                  {item.objective}
                </span>
                <span className="station mt-0.5 block text-ink-faint">
                  {formatRelative(item.scheduled_at, timezone)}
                </span>
              </span>
              <StatusChip status={item.status} />
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-[13px] leading-relaxed text-ink-soft">
        Marcar qué pasó es lo que hace que el próximo pronóstico sea mejor.
      </p>
    </section>
  );
}
