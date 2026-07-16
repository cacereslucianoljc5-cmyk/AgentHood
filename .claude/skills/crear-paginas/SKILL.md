---
name: crear-paginas
description: >
  Crea páginas web completas (landings, portfolios, dashboards, juegos, webs
  HTML) eligiendo de forma inteligente entre 9 fuentes de componentes e
  inspiración conectadas (Magic UI, React Bits, Aceternity, ui-layouts, shadcn,
  Cursify, 21st.dev, Uiverse, Pixel-Perfect) y 3 galerías de inspiración
  (Mobbin, Rebrand Gallery, Craftwork). Usar cuando el usuario pida: "crea una
  página", "hazme una landing/web/portfolio/dashboard", "replica esta página",
  "inspírate en X", "trae el HTML/CSS de un elemento", o dé título+textos para
  construir una página.
---

# Skill: crear-paginas

Construye la página que pide el usuario usando **todas las herramientas que
hagan falta** para lograr el mejor resultado — sin tope de cantidad. La única
regla es que cada herramienta que uses aporte algo real a alguna sección; no
metas una solo por meterla. Si el proyecto se beneficia de las 9 fuentes,
úsalas las 9. Nunca le pidas al usuario una página de referencia si no la dio.

## Paso 0 — Detectar el contexto (SIEMPRE primero)

1. **Stack del proyecto**: mira `package.json` / archivos del repo.
   - React/Next → todas las librerías MCP aplican.
   - HTML/JS plano (sin React) → las librerías React NO aplican; usa Uiverse
     (CSS puro), Pixel-Perfect (SVG) y CSS a mano.
   - Repo vacío → decide el stack según el pedido (por defecto: HTML+CSS+JS
     plano para páginas simples, Vite+React para apps interactivas).
2. **Modo de trabajo** según el mensaje del usuario:
   - Dio una URL o nombre de página para inspirarse → **MODO REPLICAR**.
   - No dio referencia (solo título, textos, o una idea) → **MODO CREAR**.
     En este modo está PROHIBIDO pedirle una referencia: la inspiración la
     buscas tú con las galerías (paso 2A).

## Paso 1 — Elegir herramientas (matriz orientativa, SIN tope)

Usa tantas herramientas como el proyecto necesite — no hay límite de cantidad.
Esta tabla es una guía de *qué encaja mejor* con cada tipo de página, no un
máximo: si una landing luce mejor combinando shadcn + magicui + aceternity +
reactbits + Cursify, úsalas todas. Única condición: cada herramienta debe
resolver una sección o necesidad concreta. Verifica que el servidor esté
conectado antes de planificar con él (si un MCP no responde, usa su fallback
de `references/fuentes.md`).

| Tipo de página | Herramientas que suelen encajar (puedes sumar más) | Inspiración |
|---|---|---|
| Landing SaaS / producto / startup | `shadcn` (estructura) + `magicui` (bento, marquee, number-ticker) + `aceternity` (hero con efecto) + `reactbits` (texto animado) | Craftwork, Rebrand (bentos) |
| Portfolio / web creativa | `reactbits` (texto animado, fondos) + Cursify (`scripts/cursify.sh`) + `aceternity` | Craftwork |
| Dashboard / app con UI densa | `shadcn` (forms, tablas, cards) + `ui-layouts` (layouts especiales) + `magicui` (KPIs animados) | Mobbin (patrones de apps reales) |
| Juego / experiencia inmersiva | `reactbits` + `aceternity` + Cursify (`scripts/cursify.sh`) | — |
| Página HTML plana (sin React) | Uiverse (elementos CSS puros) + Pixel-Perfect (SVG/assets) | cualquiera |
| Elemento suelto (botón, card, loader, input) | Uiverse (fetch de HTML/CSS) | — |
| Íconos, ilustraciones, assets SVG | Pixel-Perfect | — |
| Componente a medida que ninguna librería cubre | `magic21` (genera desde cero; consume créditos, úsalo cuando aporte) | — |

### Herramientas MCP disponibles (nombres exactos)

> **IMPORTANTE**: antes de traer código con cualquier MCP, consulta
> `references/fuentes.md` — tiene el estado real de cada servidor en la nube
> (varios dominios están bloqueados por la red del entorno) y los fallbacks
> verificados vía GitHub raw que funcionan siempre.

- **magicui** — `mcp__magicui__searchRegistryItems`, `listRegistryItems`,
  `getRegistryItem` (devuelve el código del componente).
- **reactbits** — `mcp__reactbits__search_components`, `list_components`,
  `list_categories`, `get_component`, `get_component_demo`.
- **aceternity** — `mcp__aceternity__search_components`, `list_categories`,
  `get_all_components`, `get_component_info`, `get_installation_info`.
- **ui-layouts** — `mcp__ui-layouts__search_components`, `get_component_meta`,
  `get_docs`, `get_source_code`.
- **shadcn** — `mcp__shadcn__search_items_in_registries`,
  `list_items_in_registries`, `view_items_in_registries`,
  `get_item_examples_from_registries`, `get_add_command_for_items`. Sirve
  también para instalar desde registries externos compatibles (p. ej.
  Aceternity) — pero NO Cursify, que no tiene registry (usa su script).
- **magic21** (21st.dev) — `mcp__magic21__21st_magic_component_builder`
  (genera componente), `21st_magic_component_inspiration` (busca ideas),
  `21st_magic_component_refiner` (mejora uno existente), `logo_search`
  (logos SVG de marcas — útil para secciones "usado por"). Créditos
  limitados: úsalo solo cuando nada más cubra la necesidad, o para
  `logo_search` que es barato.

### Fuentes sin MCP — scripts de esta skill (probados)

- **Uiverse** (uiverse.io, ~3800 elementos HTML/CSS puros) —
  `scripts/uiverse.sh search|list|get|get-url`: busca y trae el HTML y el CSS
  separados, listos para pegar.
- **Pixel-Perfect** (pixel-perfect.space, 332 bloques React + 18 SVG assets) —
  `scripts/pixelperfect.sh list|list-svg|search|get`: imprime el código
  completo del bloque y sus dependencias npm.
- **Cursify** (cursify.vercel.app, 37 efectos de cursor React) —
  `scripts/cursify.sh list|get|docs`. NO tiene registry shadcn: instalación
  copy-paste + `npm install motion clsx tailwind-merge` (el `docs <id>` trae
  los hooks que necesita).

## Paso 2A — MODO CREAR (sin referencia del usuario)

1. Extrae del pedido: tipo de página, tono (serio/creativo/oscuro/minimal),
   contenido dado (títulos, textos — úsalos LITERALMENTE, no los reescribas
   salvo que el usuario lo pida).
2. **Busca inspiración tú mismo** (no le preguntes al usuario):
   - Elige la galería según la matriz y consulta las recetas de
     `references/fuentes.md` para listar ejemplos (Rebrand para bentos,
     Craftwork para webs curadas, Mobbin para patrones de app).
   - Si las galerías no responden, usa WebSearch ("award winning <tipo> page
     design 2026", "site:mobbin.com <patrón>") o
     `mcp__magic21__21st_magic_component_inspiration` si hay créditos.
   - Decide UNA dirección de diseño (paleta, tipografía, layout de secciones)
     y anótala en 3-5 líneas antes de codear. No mezcles direcciones.
3. Mapea cada sección de la página a un componente concreto de las
   herramientas elegidas (busca primero con las tools de search de cada MCP).
4. Implementa. Contenido del usuario intacto; responsive; dark-mode si el
   proyecto ya lo tiene.

## Paso 2B — MODO REPLICAR (el usuario dio una página)

1. Trae la página con WebFetch (o pídele screenshots si es privada/login).
   Extrae: estructura de secciones, paleta (colores exactos si se ven en el
   CSS), tipografías, efectos (parallax, marquee, cursor, gradientes).
2. NO copies su código ni assets con copyright (logos, fotos, textos de
   marca). Replica el **diseño** reconstruyéndolo con componentes de las
   herramientas de esta skill: busca en cada MCP el componente más parecido a
   cada sección (p. ej. su hero con spotlight → `aceternity` spotlight; su
   grid de features → `magicui` bento-grid).
3. Donde no exista equivalente, escribe el CSS a mano — no fuerces una
   herramienta que no encaja ni agregues un MCP más solo para una sección.
4. Entrega una tabla corta "sección original → cómo la repliqué".

## Paso 3 — Verificar

- Proyecto con build (Vite/Next): `npm run build` debe pasar; levanta dev y
  haz screenshot si hay navegador disponible.
- HTML plano: abre el archivo con el navegador/Playwright y screenshot.
- Revisa que TODO el contenido que dio el usuario esté en la página.

## Anti-patrones (no hacer)

- Meter una herramienta que no resuelve ninguna sección (usar muchas está
  bien; usar una que no aporta, no).
- Pedirle al usuario una página de referencia cuando no dio una.
- Gastar créditos de `magic21` en algo que magicui/reactbits/aceternity ya
  tienen resuelto igual de bien.
- Meter librerías React (framer-motion, etc.) en un proyecto HTML plano.
- Reescribir los textos que el usuario dio.
