"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ChartNoAxesColumn, ListChecks, Sparkles, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * El armazón.
 *
 * En móvil la navegación es una barra flotante al alcance del pulgar, porque
 * la demo se enseña desde un teléfono. A partir de sm sube a la cabecera. El
 * contenido no lleva contenedor propio: cada pantalla decide si va a sangre
 * (la losa del veredicto) o dentro del ancho de lectura.
 */

const TABS = [
  { href: "/", label: "Analizar", icon: Sparkles },
  { href: "/historial", label: "Historial", icon: ListChecks },
  { href: "/patrones", label: "Patrones", icon: ChartNoAxesColumn },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

/** Se ven sin sesión y sin navegación. */
const OPEN_ROUTES = ["/entrar"];

/** Piden sesión, pero se dibujan a pantalla completa y sin barras. */
const BARE_ROUTES = ["/presentacion"];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "/resultado";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useAuth();

  const isOpenRoute = OPEN_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (status === "anonymous" && !isOpenRoute) router.replace("/entrar");
  }, [status, isOpenRoute, router, pathname]);

  if (isOpenRoute) return <main className="min-h-dvh">{children}</main>;
  if (status !== "authenticated") return <BootScreen />;

  // La presentación ocupa toda la pantalla: una barra encima la arruinaría.
  if (BARE_ROUTES.some((route) => pathname.startsWith(route))) {
    return <main className="min-h-dvh">{children}</main>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-4 px-5">
          <Link href="/" className="group flex items-center gap-2.5">
            {/* La marca del instrumento: un arco mínimo con su marca. */}
            <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden="true">
              <path
                d="M2.7 15.2A9 9 0 1 1 17.3 15.2"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="14.6" cy="5.4" r="2.6" fill="var(--accent-ink)" />
            </svg>
            <span className="font-display text-[15px] tracking-[-0.02em]">
              ¿Lo vas a cumplir?
            </span>
          </Link>

          <nav aria-label="Secciones" className="hidden sm:block">
            <ul className="flex items-center gap-0.5">
              {TABS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(pathname, href) ? "page" : undefined}
                    className={cn(
                      "station rounded-md px-2.5 py-2 transition-colors",
                      isActive(pathname, href)
                        ? "bg-ink text-paper"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-28 sm:pb-16">{children}</main>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(14px,env(safe-area-inset-bottom))] sm:hidden"
      >
        <ul className="mx-auto flex max-w-sm items-center justify-between gap-1 rounded-2xl border border-slab-rule bg-slab/95 p-1.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,.45)] backdrop-blur-md">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
                    active
                      ? "bg-slab-3 text-slab-ink"
                      : "text-slab-soft hover:text-slab-mid",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.3 : 1.8} />
                  <span className="station text-[9px]">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Mientras se resuelve si hay sesión. */
function BootScreen() {
  return (
    <div className="grid min-h-dvh place-items-center px-5" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        <svg viewBox="0 0 40 40" className="size-9 animate-spin" aria-hidden="true">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--rule)"
            strokeWidth="3"
          />
          <path
            d="M20 4a16 16 0 0 1 16 16"
            fill="none"
            stroke="var(--accent-ink)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p className="station text-ink-soft">cargando tu sesión</p>
      </div>
    </div>
  );
}
