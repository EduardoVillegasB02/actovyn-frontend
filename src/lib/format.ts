/**
 * Fechas en la zona del usuario, con Intl. Sin librerías de fechas.
 *
 * La API siempre da UTC; la zona la decide la cuenta (users.me().timezone),
 * así que todas las funciones la reciben en vez de asumir Lima.
 */

const LOCALE = "es-PE";

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** es-PE escribe "p. m."; en pantalla queda mejor "pm". */
function tidy(value: string): string {
  return value
    .replace(/\ba\.\s?m\./i, "am")
    .replace(/\bp\.\s?m\./i, "pm")
    .replace(/\s+/g, " ")
    .trim();
}

function format(
  iso: string | null | undefined,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = parse(iso);
  if (!date) return "";
  try {
    return tidy(new Intl.DateTimeFormat(LOCALE, { timeZone, ...options }).format(date));
  } catch {
    // Una zona inválida no debe tumbar la pantalla.
    return tidy(new Intl.DateTimeFormat(LOCALE, options).format(date));
  }
}

/** "7:00 pm" */
export function formatTime(iso: string | null | undefined, tz: string): string {
  return format(iso, tz, { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "sáb 19 sept, 7:00 pm" */
export function formatDateTime(iso: string | null | undefined, tz: string): string {
  const date = format(iso, tz, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = formatTime(iso, tz);
  if (!date) return "";
  return `${date.replace(/[.,]$/, "")}, ${time}`;
}

/** "19 de septiembre de 2026" */
export function formatLongDate(iso: string | null | undefined, tz: string): string {
  return format(iso, tz, { day: "numeric", month: "long", year: "numeric" });
}

/** "19 sept" — para ejes y etiquetas cortas. */
export function formatShortDate(iso: string | null | undefined, tz: string): string {
  return format(iso, tz, { day: "numeric", month: "short" }).replace(/\.$/, "");
}

/** Clave 'YYYY-MM-DD' del día local, para comparar fechas sin horas. */
function dayKey(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Relativo al día de hoy: "hoy 7:00 pm", "mañana 7:00 pm", "ayer 7:00 pm",
 * y si está más lejos, "domingo 20 sept, 7:00 pm".
 */
export function formatRelative(
  iso: string | null | undefined,
  tz: string,
  now: Date = new Date(),
): string {
  const date = parse(iso);
  if (!date) return "";

  const time = formatTime(iso, tz);
  const target = dayKey(date, tz);
  const today = dayKey(now, tz);

  if (target === today) return `hoy ${time}`;
  if (target === dayKey(new Date(now.getTime() + 86_400_000), tz))
    return `mañana ${time}`;
  if (target === dayKey(new Date(now.getTime() - 86_400_000), tz))
    return `ayer ${time}`;

  const long = format(iso, tz, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  return `${long.replace(/[.,]$/, "")}, ${time}`;
}

/** true si la fecha ya pasó. Se usa para marcar pendientes vencidas. */
export function isPast(iso: string | null | undefined, now: Date = new Date()): boolean {
  const date = parse(iso);
  return date !== null && date.getTime() < now.getTime();
}

/** "hace 3 días", "hace 2 h". Para el detalle de una intención. */
export function formatAgo(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  const date = parse(iso);
  if (!date) return "";

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(-Math.round(seconds / size), unit);
    }
  }
  return "hace un momento";
}

/** Nombres de los días, índice 0 = domingo, como los manda el backend. */
export const WEEKDAY_LABELS = [
  "Dom",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
] as const;

/**
 * Lista de zonas IANA para el selector del perfil. Se pide al navegador y, si
 * no las expone, se cae a un puñado de las de la región.
 */
export function supportedTimezones(): string[] {
  const withSupported = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  try {
    const zones = withSupported.supportedValuesOf?.("timeZone");
    if (zones && zones.length) return zones;
  } catch {
    // el navegador no lo implementa
  }
  return [
    "America/Lima",
    "America/Bogota",
    "America/Mexico_City",
    "America/Santiago",
    "America/Argentina/Buenos_Aires",
    "America/New_York",
    "Europe/Madrid",
    "UTC",
  ];
}
