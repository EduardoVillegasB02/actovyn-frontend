import Link from "next/link";
import type { ReactNode } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Error recuperable, siempre con salida: un botón que reintenta. */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-lg border-l-[3px] border-bad bg-bad-soft/70 px-4 py-3.5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <CircleAlert className="mt-0.5 size-[18px] shrink-0 text-bad" />
        <p className="min-w-0 break-words text-sm leading-snug text-bad">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="station inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-bad/30 bg-paper-2 px-3 py-2 text-bad transition-colors hover:bg-bad hover:text-white sm:self-auto"
        >
          <RotateCcw className="size-3.5" />
          reintentar
        </button>
      )}
    </div>
  );
}

/** Nada que mostrar todavía. Siempre propone el siguiente paso. */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-rule px-6 py-14 text-center">
      {icon && <div className="text-ink-faint">{icon}</div>}
      <h2 className="font-display text-[22px] leading-tight">{title}</h2>
      <p className="max-w-[34ch] text-[15px] leading-relaxed text-ink-mid">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-1 inline-flex items-center rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent-ink"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/** Bloque que ocupa el sitio exacto de lo que está por llegar. */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-rule-2", className)} />;
}
