# Fuentes verificadas — recetas de acceso y extracción

Todas las recetas de este archivo fueron **probadas de verdad** (2026-07).
Contexto clave: en Claude Code web, la política de red del entorno bloquea
muchos dominios (CONNECT 403 en el proxy). **GitHub raw y git clone SÍ
funcionan siempre** — por eso casi todas las recetas van por GitHub.

## Arreglo definitivo de red (opcional, lo hace el usuario)

Para que los MCP funcionen al 100% en la nube, añadir estos dominios al
allowlist del entorno (Entorno → Editar → Network access):

```
magicui.design, ui.shadcn.com, ui-layouts.com, reactbits.dev,
ui.aceternity.com, uiverse.io, www.pixel-perfect.space,
cursify.vercel.app, mobbin.com, www.rebrand.gallery, craftwork.design
```

Mientras tanto, los fallbacks de abajo funcionan sin tocar nada.

## Estado real de cada MCP en la nube (verificado)

| MCP | Buscar/metadata | Traer código | Fallback en la nube |
|---|---|---|---|
| `magicui` | ❌ 403 | ❌ | GitHub raw (ver abajo) ✅ |
| `reactbits` | ✅ (local) | ❌ | GitHub raw con el `path` del search ✅ |
| `aceternity` | ✅ (local) | ❌ (install usa dominio bloqueado) | solo metadata; código requiere allowlist |
| `ui-layouts` | ✅ (local) | ❌ | GitHub raw (335 items) ✅ |
| `shadcn` | ❌ (ui.shadcn.com bloqueado) | ❌ | GitHub raw por librería |
| `magic21` | ✅ API responde | ✅ | — (créditos limitados) |

Notas de uso de los MCP:
- `reactbits`: buscar con **UNA palabra** ("text", "cursor", "card") — las
  frases devuelven vacío.
- `aceternity`: `search_components` es débil; usa `list_categories` o
  `get_all_components` y filtra tú.
- `shadcn` necesita un `components.json` en el proyecto para buscar.

## Librerías de componentes React — fallbacks GitHub (verificados)

### Magic UI (251 componentes, JSON autocontenido)
```bash
# código de un componente (files[0].content trae el TSX completo):
curl -s https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/public/r/<nombre>.json
# catálogo de nombres:
git clone --depth 1 https://github.com/magicuidesign/magicui /tmp/_magicui && ls /tmp/_magicui/apps/www/public/r/
```

### React Bits
```bash
# 1) mcp__reactbits__search_components (una palabra) devuelve "path"
# 2) curl -s https://raw.githubusercontent.com/DavidHDev/react-bits/main/<path>
# ej: src/ts-tailwind/TextAnimations/BlurText/BlurText.tsx
```

### ui-layouts (335 items, JSON autocontenido)
```bash
curl -s https://raw.githubusercontent.com/ui-layouts/uilayouts/main/apps/ui-layout/public/r/<key>.json
# <key> sale de mcp__ui-layouts__search_components (funciona local)
```

### Aceternity UI
Metadata completa vía MCP (categorías, deps, tags). El código se instala con
`npx shadcn@latest add https://ui.aceternity.com/registry/<nombre>.json`, que
en la nube **requiere allowlist** de `ui.aceternity.com` (no hay espejo
GitHub). Si está bloqueado: usa un equivalente de magicui/reactbits o pide el
allowlist.

## Elementos y assets — usa los scripts de esta skill

### Uiverse (~3800 elementos HTML/CSS puros, MIT) → `scripts/uiverse.sh`
```bash
scripts/uiverse.sh search glass          # busca por tag/término
scripts/uiverse.sh list Buttons          # categorías: Buttons Cards Checkboxes Forms Inputs
                                         #   Notifications Patterns Radio-buttons Toggle-switches Tooltips loaders
scripts/uiverse.sh get alexruix big-octopus-60      # imprime HTML y CSS separados
scripts/uiverse.sh get-url https://uiverse.io/<autor>/<slug>
```
Fuente: espejo oficial `uiverse-io/galaxy` (el sitio vivo bloquea bots).
El espejo puede ir un poco por detrás del sitio: elementos muy nuevos pueden
no estar.

### Pixel-Perfect (332 bloques React + SVG assets) → `scripts/pixelperfect.sh`
```bash
scripts/pixelperfect.sh search button    # por nombre/descripción
scripts/pixelperfect.sh list-svg         # el tab "svg-assets" (18 items, TSX con <svg> inline)
scripts/pixelperfect.sh get 3d-button    # imprime el código + deps npm
```
Fuente: repo público del sitio (`vansh-nagar/Pixel-Perfect`). Ojo: los "SVG
assets" son componentes TSX con el `<svg>` inline, no archivos .svg sueltos.

### Cursify (37 efectos de cursor React) → `scripts/cursify.sh`
```bash
scripts/cursify.sh list                  # catálogo id -> archivo
scripts/cursify.sh get rainbow-cursor    # TSX del efecto
scripts/cursify.sh docs neon-cursor     # MDX con los hooks/utils que necesita
```
**Cursify NO tiene registry shadcn** (verificado en su código fuente):
instalación copy-paste. Deps: `npm install motion clsx tailwind-merge`, añade
`cn()` y el hook que indique la página docs. Fuente: repo `ui-layouts/cursify`.

## Galerías de inspiración (para MODO CREAR)

### Mobbin (patrones de apps reales iOS/Android/Web)
Bloqueado para fetch directo (sitio + login). Método que funciona: **WebSearch**
con `site:mobbin.com` — los títulos y snippets indexados describen los flujos:
```
site:mobbin.com onboarding flow
site:mobbin.com/apps <nombre de app>
site:mobbin.com/explore paywall OR "empty state"
```
Devuelve: "<App> <Plataforma> <Flujo> Flow" + descripción de pantallas.
Úsalo para decidir la estructura de un dashboard/app (qué pantallas y
patrones usa la gente real).

### Rebrand Gallery (bentos) — bloqueado total en la nube
Ni curl ni WebFetch entran. Alternativa: WebSearch
`site:rebrand.gallery bentos` o `brand bento grid design inspiration <industria>`
y describe las direcciones encontradas. Filtros conocidos del sitio:
`/bentos?industry=media`, `/bentos?industry=consumer-products`.

### Craftwork (webs curadas) — bloqueado para fetch directo en la nube
Método que funciona: **WebSearch**. Las entradas individuales viven en
`craftwork.design/curated/website/<slug>` (singular) y están indexadas:
```
site:craftwork.design/curated/website <tipo o estilo>
site:craftwork.design curated <landing|portfolio|ecommerce>
```
Ejemplos reales indexados: startups-gallery, shop, every, public-work,
boost-gallery, etc. La misma colección aparece en curated.design.
Alternativa equivalente: `best <tipo> website design 2026 inspiration`.

## Regla general cuando un fetch dé 403

1. No insistas con el mismo comando (la política de red no cambia sola).
2. Usa el fallback GitHub de arriba.
3. Si no hay fallback, dile al usuario qué dominio añadir al allowlist.
