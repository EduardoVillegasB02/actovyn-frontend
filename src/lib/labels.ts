/**
 * Etiquetas en español y el color que le toca a cada estado.
 *
 * Cada nivel de riesgo tiene dos tonos: uno para papel y otro para la losa
 * oscura. El mismo verde no funciona sobre los dos fondos, así que se
 * declaran aparte en vez de confiar en la opacidad.
 */
import type {
  Confidence,
  Difficulty,
  FactorKey,
  IntentionStatus,
  Risk,
} from "@/lib/api";

export interface RiskTheme {
  label: string;
  /** Una frase que dice qué significa el número. */
  blurb: string;
  /** Color sobre papel: texto, barras, filetes. */
  paper: string;
  /** Color sobre la losa oscura: el número gigante y el arco. */
  slab: string;
  /** Chip compacto en listas, sobre papel. */
  chip: string;
}

export const RISK_THEME: Record<Risk, RiskTheme> = {
  VERY_LIKELY: {
    label: "Muy probable",
    blurb: "Tu historial respalda este plan.",
    paper: "var(--good)",
    slab: "#4ade80",
    chip: "bg-good-soft text-good border-good/25",
  },
  LIKELY: {
    label: "Probable",
    blurb: "Va por buen camino.",
    paper: "var(--good)",
    slab: "#4ade80",
    chip: "bg-good-soft text-good border-good/25",
  },
  UNCERTAIN: {
    label: "Incierto",
    blurb: "Podría ir para cualquier lado.",
    paper: "var(--warn)",
    slab: "#fbbf24",
    chip: "bg-warn-soft text-warn border-warn/25",
  },
  HIGH_RISK: {
    label: "Riesgo alto",
    blurb: "Hay evidencia en contra.",
    paper: "var(--alert)",
    slab: "#fb923c",
    chip: "bg-alert-soft text-alert border-alert/25",
  },
  VERY_HIGH_RISK: {
    label: "Riesgo muy alto",
    blurb: "Casi todo apunta a que no pasará.",
    paper: "var(--bad)",
    slab: "#fb7185",
    chip: "bg-bad-soft text-bad border-bad/25",
  },
};

/** Las cinco zonas del arco, de peor a mejor, con su tramo del 0 al 100. */
export const RISK_ZONES: { risk: Risk; from: number; to: number }[] = [
  { risk: "VERY_HIGH_RISK", from: 0, to: 20 },
  { risk: "HIGH_RISK", from: 20, to: 40 },
  { risk: "UNCERTAIN", from: 40, to: 60 },
  { risk: "LIKELY", from: 60, to: 80 },
  { risk: "VERY_LIKELY", from: 80, to: 100 },
];

export const FACTOR_LABEL: Record<FactorKey, string> = {
  historical_adherence: "Cumplimiento histórico",
  time_compatibility: "Compatibilidad de horario",
  difficulty_fit: "Ajuste a la dificultad",
  recent_consistency: "Consistencia reciente",
  linguistic_confidence: "Firmeza del lenguaje",
};

/** Qué mide cada factor, en una línea, para el tooltip. */
export const FACTOR_HINT: Record<FactorKey, string> = {
  historical_adherence: "Con qué frecuencia cumples lo que te propones.",
  time_compatibility: "Qué tal te va a la hora que elegiste.",
  difficulty_fit: "Cómo te fue con tareas de esta exigencia.",
  recent_consistency: "Tu racha de las últimas semanas.",
  linguistic_confidence: "Qué tan firme suena como lo escribiste.",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  LOW: "Confianza baja",
  MEDIUM: "Confianza media",
  HIGH: "Confianza alta",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  LOW: "Dificultad baja",
  MEDIUM: "Dificultad media",
  HIGH: "Dificultad alta",
};

export interface StatusTheme {
  label: string;
  /** Verbo en primera persona, para los botones de cierre. */
  action: string;
  chip: string;
  /** El filete vertical que marca la fila del historial. */
  rule: string;
}

export const STATUS_THEME: Record<IntentionStatus, StatusTheme> = {
  DRAFT: {
    label: "Borrador",
    action: "Borrador",
    chip: "bg-rule-2 text-ink-soft border-rule",
    rule: "var(--rule)",
  },
  PENDING: {
    label: "Pendiente",
    action: "Pendiente",
    chip: "bg-rule-2 text-ink-mid border-rule",
    rule: "var(--ink-faint)",
  },
  COMPLETED: {
    label: "Cumplida",
    action: "Cumplí",
    chip: "bg-good-soft text-good border-good/25",
    rule: "var(--good)",
  },
  FAILED: {
    label: "Falló",
    action: "Fallé",
    chip: "bg-bad-soft text-bad border-bad/25",
    rule: "var(--bad)",
  },
  RESCHEDULED: {
    label: "Reprogramada",
    action: "La moví",
    chip: "bg-warn-soft text-warn border-warn/25",
    rule: "var(--warn)",
  },
  CANCELLED: {
    label: "Cancelada",
    action: "La cancelé",
    chip: "bg-rule-2 text-ink-soft border-rule",
    rule: "var(--rule)",
  },
};

/** El orden de las pestañas del historial. */
export const HISTORY_TABS = [
  { key: "todas", label: "Todas", statuses: [] },
  { key: "pendientes", label: "Pendientes", statuses: ["PENDING"] },
  { key: "cumplidas", label: "Cumplidas", statuses: ["COMPLETED"] },
  { key: "falladas", label: "Falladas", statuses: ["FAILED", "RESCHEDULED"] },
] as const;

export type HistoryTabKey = (typeof HISTORY_TABS)[number]["key"];
