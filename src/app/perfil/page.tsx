"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, LogOut, Presentation } from "lucide-react";
import { ErrorState } from "@/components/states";
import { ApiError, users, type User } from "@/lib/api";
import { browserTimezone, useAuth } from "@/lib/auth";
import { formatLongDate, supportedTimezones } from "@/lib/format";

export default function PerfilPage() {
  const { user } = useAuth();
  if (!user) return null;
  // La clave reinicia el formulario si cambia de cuenta, sin efectos de por medio.
  return <Perfil key={user.id} user={user} />;
}

function Perfil({ user }: { user: User }) {
  const router = useRouter();
  const { applyUser, logout } = useAuth();

  const [name, setName] = useState(user.name);
  const [lastname, setLastname] = useState(user.lastname);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zones = useMemo(() => {
    const all = supportedTimezones();
    const mine = user.timezone || browserTimezone();
    return all.includes(mine) ? all : [mine, ...all];
  }, [user.timezone]);

  const dirty =
    name !== user.name ||
    lastname !== user.lastname ||
    timezone !== user.timezone;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      applyUser(
        await users.update({
          name: name.trim(),
          lastname: lastname.trim(),
          timezone,
        }),
      );
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await logout();
    router.replace("/entrar");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-9 px-5 pt-9">
      <header className="flex flex-col gap-2">
        <p className="station text-ink-soft">
          {user.is_guest ? "cuenta de invitado" : "tu cuenta"}
        </p>
        <h1 className="text-[34px] leading-[0.98] sm:text-[42px]">
          {user.display_name || "Tu cuenta"}
        </h1>
        {!user.is_guest && (
          <p className="station mt-1 text-ink-faint">
            desde el {formatLongDate(user.created_at, user.timezone)}
          </p>
        )}
      </header>

      {user.is_guest && (
        <button
          type="button"
          onClick={() => router.push("/entrar")}
          className="group flex w-full items-center justify-between gap-3 rounded-lg border border-accent-line bg-accent-soft px-4 py-4 text-left transition-colors hover:border-accent-ink sm:px-5"
        >
          <span className="flex flex-col gap-1">
            <span className="font-display text-[19px] leading-tight text-ink">
              Guarda tu progreso
            </span>
            <span className="max-w-[40ch] text-[14px] leading-relaxed text-ink-mid">
              Con una cuenta, este historial y todo lo que aprendí de ti se
              quedan contigo. Como invitado se pierde al cerrar sesión.
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-accent-ink transition-transform group-hover:translate-x-1" />
        </button>
      )}

      <form onSubmit={save} className="flex flex-col gap-7 border-t border-rule pt-7">
        <h2 className="station text-ink-soft">Datos</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            id="name"
            label="Nombre"
            value={name}
            onChange={setName}
            autoComplete="given-name"
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="timezone" className="station text-ink-soft">
            Zona horaria
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="h-10 w-full border-b border-rule bg-transparent text-[16px] text-ink outline-none transition-colors focus:border-accent-ink"
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            Con ella calculo a qué hora local cae cada compromiso. Cámbiala si
            viajas.
          </p>
        </div>

        {user.email && (
          <div className="flex flex-col gap-1.5">
            <span className="station text-ink-soft">Email</span>
            <p className="border-b border-rule pb-2.5 text-[16px] text-ink-mid">
              {user.email}
            </p>
          </div>
        )}

        {error && <ErrorState message={error} />}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={!dirty || saving}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-ink bg-transparent px-6 font-display text-[16px] text-ink transition-colors hover:bg-ink hover:text-paper disabled:border-rule disabled:text-ink-faint disabled:hover:bg-transparent"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
          {saved && !dirty && (
            <span
              role="status"
              className="station inline-flex items-center gap-1.5 text-good"
            >
              <Check className="size-3.5" />
              guardado
            </span>
          )}
        </div>
      </form>

      {/* Atajo a la presentación: en el escenario no se teclea una URL. */}
      <div className="border-t border-rule pt-7">
        <Link
          href="/presentacion"
          className="group flex w-full items-center justify-between gap-3 rounded-lg border border-rule bg-paper-2 px-4 py-4 transition-colors hover:border-ink"
        >
          <span className="flex flex-col">
            <span className="font-display text-[17px] leading-tight">
              Modo presentación
            </span>
            <span className="station mt-1 text-ink-faint">
              once láminas · flechas para navegar
            </span>
          </span>
          <Presentation className="size-5 shrink-0 text-ink-faint transition-colors group-hover:text-ink" />
        </Link>
      </div>

      <div className="border-t border-rule pt-7">
        <button
          type="button"
          onClick={() => void signOut()}
          className="station inline-flex items-center gap-2 text-ink-soft transition-colors hover:text-bad"
        >
          <LogOut className="size-3.5" />
          cerrar sesión
        </button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="station flex items-baseline gap-2 text-ink-soft">
        {label}
        {hint && <span className="normal-case text-ink-faint">{hint}</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={80}
        autoComplete={autoComplete}
        className="h-10 w-full border-b border-rule bg-transparent text-[16px] text-ink outline-none transition-colors focus:border-accent-ink"
      />
    </div>
  );
}
