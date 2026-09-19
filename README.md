# Actovyn · web

Interfaz de Actovyn, un agente que predice qué tan probable es que cumplas un
compromiso, explica por qué y te sugiere una mejor hora.

Escribes algo como *"mañana termino mi informe a las 11pm"*. La aplicación lo
analiza contra tu historial y devuelve una probabilidad del 0 al 100, los cinco
factores que la sostienen y una hora alternativa. Cuando llega el momento
marcas qué pasó de verdad, y eso alimenta la siguiente predicción.

El backend vive en [actovyn-backend](https://github.com/EduardoVillegasB02/actovyn-backend).

## Pantallas

| Ruta | Qué hace |
|---|---|
| `/entrar` | Acceso con cuenta o como invitado, sin formulario |
| `/` | Escribir el compromiso, y check-in de lo que ya venció |
| `/resultado` | El pronóstico, la evidencia y la decisión de asumirlo |
| `/historial` | Predicción frente a realidad, con filtros y búsqueda |
| `/historial/[id]` | Detalle con la línea de tiempo de cada predicción |
| `/patrones` | Tus franjas, tu racha y qué tan calibrado está el motor |
| `/perfil` | Nombre, apellido y zona horaria |

## Stack

Next.js 16 con App Router, TypeScript en modo estricto, Tailwind 4 y algunos
primitivos de shadcn/ui. Sin librerías de estado ni de fechas: las peticiones
viven en `src/lib/api.ts` y el formato horario se resuelve con `Intl`.

## Cómo correrlo

Necesitas el backend levantado en el puerto `3025`.

```bash
cp .env.template .env.local
npm install
npm run dev          # http://localhost:4000
```

En el backend, para desarrollo local, pon `AUTH_COOKIE_CROSS_SITE=false`. Con
el proxy la cookie de sesión es de primera parte y no necesita `Secure`, que
sobre `http://localhost` el navegador rechazaría.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | Ruta de la API. Se queda en `/api` salvo que se apunte fuera |
| `API_ORIGIN` | A dónde proxea el rewrite. La URL del backend, sin `/api` ni barra final |

`NEXT_PUBLIC_API_URL` se congela al compilar: si cambia, hay que volver a
desplegar.

## La API se sirve desde el mismo origen

`next.config.ts` reescribe `/api/*` hacia el backend. No es un detalle de
comodidad, es lo que mantiene viva la sesión.

El refresh token viaja en una cookie `httpOnly`. Si la web y la API estuvieran
en dominios distintos sería una cookie de terceros, y Safari y Brave la
bloquean: el usuario entraría, recargaría y aparecería deslogueado sin ningún
error visible. Con el proxy el navegador solo habla con este dominio, así que
la cookie es de primera parte, basta `SameSite=Lax` y CORS deja de intervenir,
incluidos los preview deployments, que tienen una URL distinta cada vez.

## Despliegue en Vercel

Root Directory: `frontend`. Variables del proyecto:

```
NEXT_PUBLIC_API_URL=/api
API_ORIGIN=https://<url-publica-del-backend>
```

El backend no va en Vercel: tiene una tarea programada que purga borradores
cada hora y necesita un proceso vivo. Railway, Render o Fly sirven.

## Accesibilidad y formato

Mobile first, probado a 390 px sin desbordamiento horizontal. Todas las
pantallas tienen estado de carga, de error con reintento y vacío. Las fechas
llegan en UTC y se muestran en la zona horaria de la cuenta. Las animaciones
respetan `prefers-reduced-motion`.

## Scripts

```bash
npm run dev     # desarrollo en el puerto 4000
npm run build   # compilación de producción
npm run lint    # eslint
```
