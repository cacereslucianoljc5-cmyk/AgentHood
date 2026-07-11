# AgentHood — Generador de imágenes con IA

Web para crear imágenes a partir de texto, con estética neón verde. Escribe una
descripción y AgentHood genera la imagen al instante.

- **Stack:** Next.js 14 (App Router) + TypeScript + React 18
- **Motor de IA:** [Pollinations.ai](https://pollinations.ai) (gratis, sin API
  key, imágenes sin marca de agua)
- **Sin variables de entorno ni secretos** — se despliega tal cual en Vercel.

## Cómo funciona

- El navegador llama a la ruta interna `/api/image`, que devuelve una URL de
  imagen de Pollinations (modelo `flux`, sin logo).
- Los límites diarios se controlan en 2 sitios:
  - **Servidor** (`lib/ratelimit.ts`): tope por IP en memoria (backstop).
  - **Cliente** (`app/page.tsx`): contador visible guardado en `localStorage`.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # verifica que compila
```

## Personalizar

- **Límite diario:** `lib/ratelimit.ts` → `LIMITS.image` y
  `app/page.tsx` → `IMAGE_LIMIT` (mantén ambos números iguales).
- **Colores / tema:** `app/globals.css`, bloque `:root` (`--neon`, `--bg`, ...).
- **Textos:** título y descripción en `app/layout.tsx`; wordmark, tagline y
  footer en `app/page.tsx`.
- **Modelo de imagen:** `app/api/image/route.ts`, parámetro `model` (`flux` o
  `turbo`).
- **Imágenes de marca:** reemplaza `public/mascot.png` y `public/wordmark.jpg`
  manteniendo los nombres.

## Estructura

```
app/
  layout.tsx           metadatos + <html>
  globals.css          tema neón
  page.tsx             UI del generador de imágenes
  api/image/route.ts   endpoint de imágenes + rate limit
lib/
  ratelimit.ts         límite diario por IP
public/
  favicon.svg
  mascot.png           avatar / logo
  wordmark.jpg         logo de texto
```
