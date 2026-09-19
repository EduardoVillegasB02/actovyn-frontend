"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * El armazón de la presentación.
 *
 * El número de lámina vive en el hash de la URL, no en el estado: así se
 * puede saltar a una concreta desde la barra de direcciones y, si el
 * navegador se recarga a media exposición, se vuelve donde estabas. Estar en
 * el escenario y perder el sitio por un refresco es el peor momento posible.
 */

function subscribeHash(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const readHash = (): string => window.location.hash;
const readHashOnServer = (): string => "";

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

export function Deck({ slides }: { slides: ReactNode[] }) {
  const router = useRouter();
  const hash = useSyncExternalStore(subscribeHash, readHash, readHashOnServer);
  const last = slides.length - 1;
  const index = clamp(Number.parseInt(hash.slice(1), 10) - 1, last);

  const surface = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback(
    (next: number) => {
      window.location.hash = String(clamp(next, last) + 1);
    },
    [last],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          prev();
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(last);
          break;
        case "Escape":
          router.push("/");
          break;
        case "f":
          // Pantalla completa: una tecla, porque en el escenario no hay tiempo.
          void (document.fullscreenElement
            ? document.exitFullscreen()
            : surface.current?.requestFullscreen());
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, last, router]);

  function onTouchStart(event: React.TouchEvent) {
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Solo cuenta el gesto claramente horizontal: si no, es un scroll.
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
    touchStart.current = null;
  }

  return (
    <div
      ref={surface}
      className="slab relative flex min-h-dvh flex-col overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Barra de avance: dice cuánto queda sin robar espacio a la lámina. */}
      <div
        className="absolute inset-x-0 top-0 z-20 h-[3px] bg-white/10"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[--accent-lit] transition-[width] duration-300 ease-out"
          style={{ width: `${((index + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div
        key={index}
        className="rise flex flex-1 flex-col justify-center px-6 py-16 sm:px-14 md:px-20"
        role="group"
        aria-roledescription="lámina"
        aria-label={`Lámina ${index + 1} de ${slides.length}`}
      >
        <div className="mx-auto w-full max-w-4xl">{slides[index]}</div>
      </div>

      {/* Controles: discretos, pero suficientes para dar la charla con el ratón. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 px-5 pb-5 sm:px-8 sm:pb-6">
        <span className="station tnum text-slab-soft">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>

        <div className="flex items-center gap-2">
          <DeckButton onClick={prev} disabled={index === 0} label="Anterior">
            <ChevronLeft className="size-5" />
          </DeckButton>
          <DeckButton onClick={next} disabled={index === last} label="Siguiente">
            <ChevronRight className="size-5" />
          </DeckButton>
          <DeckButton onClick={() => router.push("/")} label="Salir de la presentación">
            <X className="size-5" />
          </DeckButton>
        </div>
      </div>

      <p className="station absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-slab-soft/60 lg:block">
        ← → para navegar · f para pantalla completa · esc para salir
      </p>
    </div>
  );
}

function DeckButton({
  onClick,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-11 place-items-center rounded-full border border-slab-rule text-slab-mid transition-colors",
        "hover:border-slab-soft hover:text-slab-ink disabled:opacity-25 disabled:hover:border-slab-rule",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Piezas de composición, para que las láminas se escriban rápido      */
/* ------------------------------------------------------------------ */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="station mb-6 text-[--accent-lit]">{children}</p>;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[clamp(34px,7.5vw,76px)] leading-[0.96] tracking-[-0.035em] text-slab-ink">
      {children}
    </h2>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="mt-7 max-w-[46ch] text-[clamp(17px,2.4vw,24px)] leading-[1.55] text-slab-mid">
      {children}
    </p>
  );
}

/** Lista numerada. El número dice que hay un orden, no decora. */
export function Points({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-10 flex flex-col gap-5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-5">
          <span className="station shrink-0 pt-2 text-slab-soft">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[clamp(17px,2.2vw,22px)] leading-[1.45] text-slab-ink">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
