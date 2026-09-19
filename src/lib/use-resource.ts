"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

/**
 * Carga un recurso del backend con sus tres estados.
 *
 * El estado nunca se toca de forma síncrona dentro del efecto: todo cambio
 * ocurre después del await, que es lo que evita los renders en cascada.
 */

export type Resource<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: string };

const LOADING = { status: "loading", data: null, error: null } as const;

export function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useResource<T>(
  fetcher: () => Promise<T>,
  fallbackMessage = "No se pudo cargar. Inténtalo de nuevo.",
): Resource<T> & { reload: () => void; setData: (data: T) => void } {
  const [state, setState] = useState<Resource<T>>(LOADING);
  /** Cambiarlo relanza el efecto; es el botón de reintentar. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;

    // El cuerpo empieza en el await: nada se asigna antes de la respuesta.
    const run = async () => {
      try {
        const data = await fetcher();
        if (alive) setState({ status: "ready", data, error: null });
      } catch (error) {
        if (alive)
          setState({
            status: "error",
            data: null,
            error: messageOf(error, fallbackMessage),
          });
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [fetcher, attempt, fallbackMessage]);

  const reload = useCallback(() => {
    setState(LOADING);
    setAttempt((value) => value + 1);
  }, []);

  const setData = useCallback((data: T) => {
    setState({ status: "ready", data, error: null });
  }, []);

  return { ...state, reload, setData };
}
