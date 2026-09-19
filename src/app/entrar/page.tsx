"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/states";
import { ApiError } from "@/lib/api";
import { browserTimezone, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export default function EntrarPage() {
  const router = useRouter();
  const { status, login, register, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [busy, setBusy] = useState<"form" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy("form");
    setError(null);
    try {
      if (mode === "login") {
        await login({ email: email.trim(), password });
      } else {
        await register({
          email: email.trim(),
          password,
          name: name.trim(),
          lastname: lastname.trim() || undefined,
          timezone: browserTimezone(),
        });
      }
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ocurrió un error inesperado.");
      setBusy(null);
    }
  }

  async function asGuest() {
    if (busy) return;
    setBusy("guest");
    setError(null);
    try {
      await continueAsGuest();
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ocurrió un error inesperado.");
      setBusy(null);
    }
  }

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= (mode === "register" ? 8 : 1) &&
    (mode === "login" || name.trim().length > 0);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* El titular sobre la losa: lo primero que se ve es el instrumento. */}
      <section className="slab slab-grid px-5 pb-12 pt-14">
        <div className="mx-auto w-full max-w-md">
          <p className="station text-slab-soft">estación de pronóstico</p>
          <h1 className="mt-4 text-[42px] leading-[0.94] text-slab-ink sm:text-[54px]">
            ¿Lo vas a
            <br />
            cumplir?
          </h1>
          <p className="mt-5 max-w-[38ch] text-[15px] leading-[1.7] text-slab-mid">
            Escribe un compromiso y te digo qué tan probable es que lo cumplas,
            por qué, y a qué hora te iría mejor. Aprendo de lo que de verdad
            haces.
          </p>

          {/* La muestra del producto, antes de pedir nada. */}
          <div className="mt-8 flex items-center gap-5 rounded-xl border border-slab-rule px-4 py-4">
            <div className="flex shrink-0 flex-col items-center">
              <span
                className="tnum font-display text-[42px] leading-none"
                style={{ color: "#fb923c" }}
              >
                39
              </span>
              <span className="station mt-1 text-slab-soft">de 100</span>
            </div>
            <div className="min-w-0 border-l border-slab-rule pl-5">
              <p className="text-[15px] leading-snug text-slab-ink">
                “Mañana termino mi informe a las 11pm”
              </p>
              <p className="station mt-2 text-[#fb923c]">
                riesgo alto · a esa hora cumples el 20%
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-md flex-col gap-7 px-5 pb-14 pt-9">
        <button
          type="button"
          onClick={asGuest}
          disabled={busy !== null}
          className="group flex w-full items-center justify-between gap-3 rounded-lg bg-ink px-5 py-[18px] text-left text-paper transition-colors hover:bg-accent-ink disabled:opacity-60"
        >
          <span className="flex flex-col">
            <span className="font-display text-[19px] leading-tight">
              {busy === "guest" ? "Preparando…" : "Pruébalo ahora"}
            </span>
            <span className="station mt-1 text-white/45">
              sin formulario · conservas tu historial al registrarte
            </span>
          </span>
          {busy === "guest" ? (
            <Loader2 className="size-5 shrink-0 animate-spin" />
          ) : (
            <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
          )}
        </button>

        <div className="flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-rule" />
          <span className="station text-ink-faint">o con tu cuenta</span>
          <span className="h-px flex-1 bg-rule" />
        </div>

        <div className="flex flex-col gap-5">
          <div
            role="tablist"
            aria-label="Entrar o crear cuenta"
            className="flex gap-6 border-b border-rule"
          >
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                role="tab"
                type="button"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={cn(
                  "station -mb-px border-b-2 pb-3 transition-colors",
                  mode === value
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-faint hover:text-ink-mid",
                )}
              >
                {value === "login" ? "entrar" : "crear cuenta"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <Field
                  id="name"
                  label="Nombre"
                  value={name}
                  onChange={setName}
                  autoComplete="given-name"
                  required
                />
                <Field
                  id="lastname"
                  label="Apellido"
                  value={lastname}
                  onChange={setLastname}
                  autoComplete="family-name"
                  hint="opcional"
                />
              </div>
            )}

            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="ana@ejemplo.com"
              required
            />

            <Field
              id="password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              hint={mode === "register" ? "mínimo 8" : undefined}
              required
            />

            {error && <ErrorState message={error} />}

            <button
              type="submit"
              disabled={!canSubmit || busy !== null}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-lg border border-ink bg-transparent py-3.5 font-display text-[17px] text-ink transition-colors hover:bg-ink hover:text-paper disabled:border-rule disabled:text-ink-faint disabled:hover:bg-transparent"
            >
              {busy === "form" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "login" ? "Entrando…" : "Creando tu cuenta…"}
                </>
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  hint,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="station flex items-baseline gap-2 text-ink-soft"
      >
        {label}
        {hint && <span className="text-ink-faint normal-case">{hint}</span>}
      </label>
      {/* Campos sin caja: un filete abajo, como una ficha que se rellena. */}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="h-10 w-full border-b border-rule bg-transparent text-[16px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent-ink"
      />
    </div>
  );
}
