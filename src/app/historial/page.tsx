"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, List, Loader2, Search } from "lucide-react";
import { EmptyState, ErrorState, Shimmer } from "@/components/states";
import { IntentionRow } from "@/components/intention-row";
import {
  MonthCalendar,
  monthRange,
  thisMonth,
  type CalendarMonth,
} from "@/components/month-calendar";
import {
  ApiError,
  intentions as api,
  type CloseStatus,
  type FilterableStatus,
  type Intention,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { HISTORY_TABS, type HistoryTabKey } from "@/lib/labels";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function HistorialPage() {
  return (
    <Suspense fallback={<HistorialSkeleton />}>
      <Historial />
    </Suspense>
  );
}

function Historial() {
  const router = useRouter();
  const params = useSearchParams();
  const { timezone } = useAuth();

  const tab = (params.get("tab") as HistoryTabKey | null) ?? "todas";
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [query, setQuery] = useState(search);

  const [items, setItems] = useState<Intention[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [closing, setClosing] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  // El calendario es otra pregunta, no otro filtro: trae su propio mes.
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [monthCursor, setMonthCursor] = useState<CalendarMonth>(() => thisMonth());
  const [monthItems, setMonthItems] = useState<Intention[] | null>(null);
  const [monthLoading, setMonthLoading] = useState(false);

  // La búsqueda espera a que el usuario deje de escribir.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const statuses = useMemo(
    () =>
      (HISTORY_TABS.find((t) => t.key === tab)?.statuses ??
        []) as readonly FilterableStatus[],
    [tab],
  );

  /** Identifica la petición en vuelo: solo la última puede pintar. */
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setItems(null);
    setError(null);
    try {
      const page = await api.list({
        status: statuses.length ? [...statuses] : undefined,
        q: query || undefined,
        limit: PAGE_SIZE,
      });
      if (id !== requestId.current) return;
      setItems(page.items);
      setCursor(page.next_cursor);
      setTotal(page.total);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof ApiError ? e.message : "Ocurrió un error inesperado.");
    }
  }, [statuses, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthFetcher = useCallback(async () => {
    const { from, to } = monthRange(monthCursor);
    return api.list({ from, to, sort: "scheduled_at", order: "asc", limit: 100 });
  }, [monthCursor]);

  // Se deja fuera de useResource porque la vista lista y la de calendario
  // comparten pantalla y no deben pisarse el estado de carga.
  useEffect(() => {
    if (view !== "calendario") return;
    let alive = true;
    const run = async () => {
      setMonthLoading(true);
      try {
        const page = await monthFetcher();
        if (alive) setMonthItems(page.items);
      } catch {
        if (alive) setMonthItems([]);
      } finally {
        if (alive) setMonthLoading(false);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [view, monthFetcher]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.list({
        status: statuses.length ? [...statuses] : undefined,
        q: query || undefined,
        limit: PAGE_SIZE,
        cursor,
      });
      setItems((current) => [...(current ?? []), ...page.items]);
      setCursor(page.next_cursor);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar más.");
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, statuses, query]);

  /** Cierra con actualización optimista y revierte si el servidor dice que no. */
  const close = useCallback(
    async (id: string, status: CloseStatus) => {
      const snapshot = items;
      if (!snapshot) return;

      setItems(
        snapshot.map((item) =>
          item.id === id
            ? { ...item, status, closed_at: new Date().toISOString() }
            : item,
        ),
      );
      setClosing((current) => ({ ...current, [id]: true }));
      setRowErrors((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      try {
        const updated = await api.close(id, status);
        setItems((current) =>
          (current ?? []).map((item) => (item.id === id ? updated : item)),
        );
      } catch (e) {
        setItems(snapshot);
        setRowErrors((current) => ({
          ...current,
          [id]:
            e instanceof ApiError ? e.message : "No se pudo guardar el estado.",
        }));
      } finally {
        setClosing((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }
    },
    [items],
  );

  function selectTab(key: HistoryTabKey) {
    const next = new URLSearchParams(params.toString());
    if (key === "todas") next.delete("tab");
    else next.set("tab", key);
    router.replace(next.toString() ? `/historial?${next}` : "/historial", {
      scroll: false,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pt-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="station text-ink-soft">predicción vs. realidad</p>
          <h1 className="text-[34px] leading-[0.98] sm:text-[42px]">Historial</h1>
        </div>

        <div
          role="tablist"
          aria-label="Forma de ver el historial"
          className="flex items-center gap-1 rounded-lg border border-rule bg-paper-2 p-1"
        >
          {([
            { key: "lista", label: "Lista", Icon: List },
            { key: "calendario", label: "Calendario", Icon: CalendarDays },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn(
                "station flex items-center gap-1.5 rounded-md px-2.5 py-2 transition-colors",
                view === key
                  ? "bg-ink text-paper"
                  : "text-ink-faint hover:text-ink",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {view === "calendario" ? (
        <MonthCalendar
          items={monthItems ?? []}
          timezone={timezone}
          cursor={monthCursor}
          onCursorChange={setMonthCursor}
          loading={monthLoading || monthItems === null}
        />
      ) : (
      <>
      <div className="flex flex-col gap-4">
        <div
          role="tablist"
          aria-label="Filtrar por estado"
          className="-mx-5 flex gap-6 overflow-x-auto border-b border-rule px-5"
        >
          {HISTORY_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
              className={cn(
                "station -mb-px shrink-0 border-b-2 pb-3 transition-colors",
                tab === key
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-faint hover:text-ink-mid",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex items-center gap-2.5 border-b border-rule pb-2 focus-within:border-accent-ink">
          <Search className="size-4 shrink-0 text-ink-faint" />
          <input
            id="buscar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar en tus compromisos"
            aria-label="Buscar en tus compromisos"
            className="h-7 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      {items === null && !error && <HistorialSkeleton />}

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {items !== null && items.length === 0 && !error && (
        <EmptyState
          title={query ? "Sin resultados" : "Aún no tienes compromisos aquí"}
          description={
            query
              ? `No encontré nada que coincida con “${query}”.`
              : "Cuando analices algo y te comprometas, aparecerá en esta lista."
          }
          actionLabel={query ? undefined : "Analizar mi primer compromiso"}
          actionHref={query ? undefined : "/"}
        />
      )}

      {items !== null && items.length > 0 && (
        <>
          <p className="station tnum text-ink-faint">
            {items.length} de {total}
          </p>

          <ul className="-mt-2 flex flex-col border-b border-rule">
            {items.map((intention) => (
              <div key={intention.id} className="contents">
                <IntentionRow
                  intention={intention}
                  timezone={timezone}
                  busy={closing[intention.id] === true}
                  onClose={(id, status) => void close(id, status)}
                />
                {rowErrors[intention.id] && (
                  <ErrorState message={rowErrors[intention.id]} />
                )}
              </div>
            ))}
          </ul>

          {cursor && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="station flex h-12 items-center justify-center gap-2 rounded-lg border border-rule text-ink-mid transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  cargando
                </>
              ) : (
                "cargar más"
              )}
            </button>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}

function HistorialSkeleton() {
  return (
    <ul className="flex flex-col" aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="flex flex-col gap-3 border-t border-rule py-4 pl-4">
          <div className="flex justify-between gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Shimmer className="h-5 w-2/3" />
              <Shimmer className="h-3 w-1/3" />
            </div>
            <Shimmer className="h-8 w-10" />
          </div>
          <Shimmer className="h-5 w-24 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
