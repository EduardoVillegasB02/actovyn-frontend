/**
 * Cliente HTTP tipado. Único lugar donde se habla con el backend.
 *
 * Los tipos espejan el contrato de la API v2 tal como lo emiten los mappers
 * HTTP del backend (snake_case). No se inventan campos.
 *
 * La sesión: el access token vive en memoria (nunca en localStorage, que es
 * legible por cualquier script) y el refresh viaja en una cookie httpOnly que
 * pone el backend. Por eso todas las llamadas van con credentials: "include".
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3025/api";

/* ------------------------------------------------------------------ */
/* Vocabulario                                                         */
/* ------------------------------------------------------------------ */

export type Difficulty = "LOW" | "MEDIUM" | "HIGH";

export type Risk =
  | "VERY_LIKELY"
  | "LIKELY"
  | "UNCERTAIN"
  | "HIGH_RISK"
  | "VERY_HIGH_RISK";

export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export type IntentionStatus =
  | "DRAFT"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "RESCHEDULED"
  | "CANCELLED";

/** Estados con los que se cierra una intención ya asumida. */
export type CloseStatus =
  | "COMPLETED"
  | "FAILED"
  | "RESCHEDULED"
  | "CANCELLED";

export const CLOSE_STATUSES: readonly CloseStatus[] = [
  "COMPLETED",
  "FAILED",
  "RESCHEDULED",
  "CANCELLED",
];

/** Los estados que el historial puede filtrar. DRAFT no se lista. */
export type FilterableStatus = Exclude<IntentionStatus, "DRAFT">;

export type FactorKey =
  | "historical_adherence"
  | "time_compatibility"
  | "difficulty_fit"
  | "recent_consistency"
  | "linguistic_confidence";

export const FACTOR_KEYS: readonly FactorKey[] = [
  "historical_adherence",
  "time_compatibility",
  "difficulty_fit",
  "recent_consistency",
  "linguistic_confidence",
];

/** Solo estos tres tienen observaciones contables que auditar. */
export type EvidenceKey =
  | "historical_adherence"
  | "time_compatibility"
  | "difficulty_fit";

export type HourBand =
  | "MADRUGADA"
  | "MANANA"
  | "TARDE"
  | "NOCHE"
  | "NOCTURNO";

/* ------------------------------------------------------------------ */
/* Usuario y sesión                                                    */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  /** null en cuentas de invitado. */
  email: string | null;
  name: string;
  lastname: string;
  /** Nombre y apellido ya compuestos por el backend. */
  display_name: string;
  /** IANA. Con ella se formatea todo en el cliente. */
  timezone: string;
  is_guest: boolean;
  created_at: string;
}

export interface Session {
  user: User;
  access_token: string;
  expires_in: number;
  /** Solo presente si el backend corre sin cookie (AUTH_REFRESH_IN_BODY). */
  refresh_token?: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  lastname?: string;
  timezone: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface UpdateUserBody {
  name?: string;
  lastname?: string;
  timezone?: string;
}

/* ------------------------------------------------------------------ */
/* Predicciones e intenciones                                          */
/* ------------------------------------------------------------------ */

export type Analysis = Record<FactorKey, number>;
export type Evidence = Partial<Record<EvidenceKey, number>>;

export interface Recommendation {
  id: string;
  reason: string;
  suggestion: string;
  /** Hora alternativa propuesta, en UTC. */
  suggested_at: string | null;
}

/** El veredicto del motor, sin la intención. */
export interface PredictionSnapshot {
  analysis: Analysis;
  evidence: Evidence;
  commitment_score: number;
  risk: Risk;
  confidence: Confidence;
  sample_size: number;
  capped_by: string[];
  recommendation: Recommendation;
}

export interface AnalyzedIntention {
  id: string;
  objective: string;
  category: string | null;
  scheduled_at: string | null;
  local_hour: number | null;
  difficulty: Difficulty;
  /** Siempre DRAFT al analizar: todavía no es un compromiso. */
  status: IntentionStatus;
}

export interface AnalyzeResponse extends PredictionSnapshot {
  intention: AnalyzedIntention;
}

/** Una predicción guardada, con sus factores ya aplanados. */
export interface Prediction {
  id: string;
  commitment_score: number;
  risk: Risk;
  confidence: Confidence;
  sample_size: number;
  historical_adherence: number;
  time_compatibility: number;
  difficulty_fit: number;
  recent_consistency: number;
  linguistic_confidence: number;
  capped_by: string[];
  created_at: string;
  recommendation: (Recommendation & { accepted: boolean | null }) | null;
}

export interface Intention {
  id: string;
  objective: string;
  category: string | null;
  raw_message: string;
  scheduled_at: string | null;
  local_hour: number | null;
  weekday: number | null;
  difficulty: Difficulty;
  status: IntentionStatus;
  closed_at: string | null;
  created_at: string;
  rescheduled_from_id: string | null;
  /** La más reciente primero. */
  predictions: Prediction[];
}

export interface IntentionPage {
  items: Intention[];
  next_cursor: string | null;
  total: number;
}

export interface RescheduleResponse {
  intention: Intention;
  prediction: PredictionSnapshot;
  /** El score de antes, para poder enseñar el salto. */
  previous_score: number | null;
}

export interface ListIntentionsQuery {
  status?: FilterableStatus[];
  from?: string;
  to?: string;
  scheduled_before?: string;
  category?: string;
  q?: string;
  sort?: "scheduled_at" | "created_at";
  order?: "asc" | "desc";
  limit?: number;
  cursor?: string;
  include_drafts?: boolean;
}

/* ------------------------------------------------------------------ */
/* Panel de patrones                                                   */
/* ------------------------------------------------------------------ */

export interface RateSlice {
  total: number;
  completed: number;
  /** 0-100. null cuando no hay cerradas con las que calcularlo. */
  rate: number | null;
}

export interface Stats {
  period: { from: string; to: string };
  totals: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    rescheduled: number;
    cancelled: number;
    completion_rate: number | null;
  };
  streak: { current: number; best: number };
  by_hour_band: (RateSlice & { band: HourBand; label: string })[];
  by_weekday: (RateSlice & { weekday: number })[];
  by_category: (RateSlice & { category: string })[];
  by_difficulty: (RateSlice & { difficulty: Difficulty })[];
  trend: (RateSlice & { week_start: string })[];
  calibration: {
    bucket: string;
    n: number;
    predicted_avg: number;
    actual_rate: number;
  }[];
  recommendations: {
    suggested: number;
    accepted: number;
    completed_when_accepted: number;
    completed_when_ignored: number;
  };
  highlights: { type: string; text: string }[];
}

/* ------------------------------------------------------------------ */
/* Errores                                                             */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  /** La sesión no vale: hay que volver a entrar. */
  get isAuth(): boolean {
    return this.status === 401;
  }

  /** El estado del recurso ya no permite esta acción. */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** Se acabó el cupo de análisis. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/* ------------------------------------------------------------------ */
/* Transporte                                                          */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null;
/** Se avisa a la app cuando el backend rechaza la sesión. */
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, unknown>;
  /** Las rutas de /auth no deben reintentar con refresh: son el refresh. */
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  // API_URL puede ser relativo ("/api") si algún día se sirve tras un proxy.
  const base = new URL(
    `${API_URL}${path}`,
    typeof window === "undefined" ? "http://localhost" : window.location.origin,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        // Un filtro repetible se manda repitiendo la clave: status=A&status=B
        for (const item of value) base.searchParams.append(key, String(item));
      } else {
        base.searchParams.set(key, String(value));
      }
    }
  }
  return base.toString();
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join(". ")
      : body.message;
    if (message) return message;
  } catch {
    // sin cuerpo legible
  }
  if (res.status === 429)
    return "Has hecho muchos análisis seguidos. Espera unos minutos.";
  if (res.status >= 500)
    return "El servidor tuvo un problema. Inténtalo de nuevo.";
  return `El servidor respondió con error ${res.status}.`;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      // Imprescindible: el refresh token viaja en cookie httpOnly.
      credentials: "include",
      cache: "no-store",
      signal: options.signal,
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa que esté encendido.",
    );
  }
}

/** Una sola renovación en vuelo, aunque fallen varias peticiones a la vez. */
let refreshing: Promise<Session | null> | null = null;

async function tryRefresh(): Promise<Session | null> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await send("/auth/refresh", {
          method: "POST",
          body: {},
          skipRefresh: true,
        });
        if (!res.ok) return null;
        const session = (await res.json()) as Session;
        accessToken = session.access_token;
        return session;
      } catch {
        return null;
      } finally {
        // Se libera en el microtask siguiente para que todos lean el mismo
        // resultado antes de que otra petición dispare otra renovación.
        setTimeout(() => {
          refreshing = null;
        }, 0);
      }
    })();
  }
  return refreshing;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options);

  // 401 con sesión: puede ser solo el access token vencido. Se renueva una vez.
  if (res.status === 401 && !options.skipRefresh) {
    const session = await tryRefresh();
    if (session) {
      res = await send(path, options);
    } else {
      accessToken = null;
      onUnauthorized?.();
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      accessToken = null;
      onUnauthorized?.();
    }
    throw new ApiError(await readError(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

export const auth = {
  register(body: RegisterBody): Promise<Session> {
    // Sin skipRefresh: si hay token de invitado, el backend convierte
    // esa cuenta en vez de crear otra, y conserva su historial.
    return request<Session>("/auth/register", {
      method: "POST",
      body,
      skipRefresh: true,
    });
  },
  login(body: LoginBody): Promise<Session> {
    return request<Session>("/auth/login", {
      method: "POST",
      body,
      skipRefresh: true,
    });
  },
  guest(timezone: string): Promise<Session> {
    return request<Session>("/auth/guest", {
      method: "POST",
      body: { timezone },
      skipRefresh: true,
    });
  },
  refresh(): Promise<Session> {
    return request<Session>("/auth/refresh", {
      method: "POST",
      body: {},
      skipRefresh: true,
    });
  },
  logout(): Promise<void> {
    return request<void>("/auth/logout", {
      method: "POST",
      body: {},
      skipRefresh: true,
    });
  },
};

export const users = {
  me(): Promise<User> {
    return request<User>("/users/me");
  },
  update(body: UpdateUserBody): Promise<User> {
    return request<User>("/users/me", { method: "PATCH", body });
  },
};

export const intentions = {
  analyze(message: string): Promise<AnalyzeResponse> {
    return request<AnalyzeResponse>("/intentions/analyze", {
      method: "POST",
      body: { message },
    });
  },
  commit(id: string): Promise<Intention> {
    return request<Intention>(`/intentions/${id}/commit`, { method: "POST" });
  },
  reschedule(id: string, scheduledAt: string): Promise<RescheduleResponse> {
    return request<RescheduleResponse>(`/intentions/${id}/reschedule`, {
      method: "POST",
      body: { scheduled_at: scheduledAt },
    });
  },
  discard(id: string): Promise<void> {
    return request<void>(`/intentions/${id}`, { method: "DELETE" });
  },
  list(query: ListIntentionsQuery = {}): Promise<IntentionPage> {
    return request<IntentionPage>("/intentions", {
      query: { ...query } as Record<string, unknown>,
    });
  },
  detail(id: string): Promise<Intention> {
    return request<Intention>(`/intentions/${id}`);
  },
  close(id: string, status: CloseStatus): Promise<Intention> {
    return request<Intention>(`/intentions/${id}/close`, {
      method: "PATCH",
      body: { status },
    });
  },
};

export function fetchStats(range?: {
  from?: string;
  to?: string;
}): Promise<Stats> {
  return request<Stats>("/stats", { query: range });
}
