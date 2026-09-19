import type { NextConfig } from "next";

/**
 * La API se sirve desde el mismo origen que la web, vía proxy.
 *
 * El motivo es la sesión: el refresh token viaja en una cookie httpOnly, y
 * una cookie que cruza dominios es de terceros. Safari la bloquea siempre y
 * Brave también, así que el usuario entraría, recargaría y aparecería
 * deslogueado sin ningún error visible.
 *
 * Proxeando, el navegador solo habla con este dominio: la cookie es de
 * primera parte, vale SameSite=Lax y CORS deja de existir, incluido el de los
 * preview deployments, que tienen una URL distinta en cada despliegue.
 *
 * API_ORIGIN es la URL del backend (sin la ruta /api, que la añade el rewrite).
 */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:3025";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
