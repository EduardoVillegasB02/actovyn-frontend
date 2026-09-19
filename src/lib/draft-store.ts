/**
 * El borrador en curso, entre Analizar y Resultado.
 *
 * Vive en sessionStorage porque es estado de una sola pestaña y de un solo
 * rato: el registro de verdad ya está en el backend como intención DRAFT.
 */
import type { AnalyzeResponse } from "@/lib/api";

const KEY = "cumplir:draft";

export interface StoredDraft {
  /** El texto original, para poder volver a analizarlo igual. */
  message: string;
  result: AnalyzeResponse;
  /** Score de la predicción anterior, si se reprogramó. */
  previousScore: number | null;
}

export function saveDraft(draft: StoredDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Sin almacenamiento, Resultado mostrará su estado vacío.
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nada que limpiar
  }
}

/** Snapshot crudo, estable entre renders, para useSyncExternalStore. */
export function readRawDraft(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** En el servidor no hay sessionStorage: undefined significa "hidratando". */
export function readRawDraftServer(): undefined {
  return undefined;
}

export function subscribeDraft(): () => void {
  // sessionStorage no emite eventos en la propia pestaña, y Resultado se queda
  // con el borrador en su propio estado tras leerlo: no hay a qué suscribirse.
  return () => {};
}

export function parseDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed.result || typeof parsed.message !== "string") return null;
    return {
      message: parsed.message,
      result: parsed.result,
      previousScore:
        typeof parsed.previousScore === "number" ? parsed.previousScore : null,
    };
  } catch {
    return null;
  }
}
