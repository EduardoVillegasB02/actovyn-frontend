"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  auth as authApi,
  setAccessToken,
  setUnauthorizedHandler,
  users,
  type LoginBody,
  type RegisterBody,
  type Session,
  type User,
} from "@/lib/api";

/**
 * La sesión de la aplicación.
 *
 * El access token no se guarda en disco: vive en memoria dentro del cliente
 * HTTP. Al arrancar se intenta una renovación contra la cookie httpOnly, que
 * es lo que de verdad sostiene la sesión entre recargas.
 */

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  /** Zona IANA del usuario; Lima mientras no haya sesión. */
  timezone: string;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  applyUser: (user: User) => void;
}

const FALLBACK_TZ = "America/Lima";

const AuthContext = createContext<AuthValue | null>(null);

/** La zona del navegador, o Lima si no se puede leer. */
export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TZ;
  } catch {
    return FALLBACK_TZ;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  /**
   * El arranque, guardado como promesa. Con el StrictMode de desarrollo el
   * efecto corre dos veces; así la segunda se engancha a la misma renovación
   * en vez de lanzar otra, y el resultado se aplica igual.
   */
  const bootstrap = useRef<Promise<void> | null>(null);

  const adopt = useCallback((session: Session) => {
    setAccessToken(session.access_token);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  // Al arrancar: si la cookie sigue viva, la sesión vuelve sola.
  useEffect(() => {
    if (bootstrap.current) return;
    bootstrap.current = (async () => {
      try {
        adopt(await authApi.refresh());
      } catch {
        clear();
      }
    })();
  }, [adopt, clear]);

  // Si el backend rechaza la sesión a media navegación, se cae a anónimo.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(
    async (body: LoginBody) => adopt(await authApi.login(body)),
    [adopt],
  );

  const register = useCallback(
    async (body: RegisterBody) => adopt(await authApi.register(body)),
    [adopt],
  );

  const continueAsGuest = useCallback(
    async () => adopt(await authApi.guest(browserTimezone())),
    [adopt],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }, [clear]);

  const applyUser = useCallback((next: User) => setUser(next), []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      timezone: user?.timezone ?? browserTimezone(),
      login,
      register,
      continueAsGuest,
      logout,
      applyUser,
    }),
    [status, user, login, register, continueAsGuest, logout, applyUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
}

/**
 * Refresca el usuario desde el servidor. Se usa tras cambiar el perfil, para
 * que el nombre y la zona nuevos se vean en toda la aplicación.
 */
export function useRefreshUser(): () => Promise<void> {
  const { applyUser } = useAuth();
  return useCallback(async () => {
    applyUser(await users.me());
  }, [applyUser]);
}
