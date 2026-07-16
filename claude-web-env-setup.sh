#!/bin/bash
# Setup script para Claude Code on the web.
# En cada sesion (cualquier repo, presente o futuro) instala:
#   1) .mcp.json en el repo -> 6 servidores MCP de UI (API key de 21st.dev incluida)
#   2) la skill crear-paginas en DOS sitios:
#        - ~/.claude/skills/crear-paginas   (nivel usuario: visible en CUALQUIER repo)
#        - <repo>/.claude/skills/crear-paginas (nivel proyecto: por si se commitea)
#   3) una nota en ~/.claude/CLAUDE.md para que baste una frase ("creame una
#      landing de X") para que Claude use la skill sin que se lo pidas dos veces.
set -e

TARGET_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
HOME_DIR="${HOME:-/root}"
USER_SKILL="${HOME_DIR}/.claude/skills/crear-paginas"
PROJ_SKILL="${TARGET_DIR}/.claude/skills/crear-paginas"

# ---- 1) .mcp.json (scope de proyecto: es el unico que Claude Code web carga) ----
cat > "${TARGET_DIR}/.mcp.json" <<'EOF_MCP'
{
  "mcpServers": {
    "magicui":    { "command": "npx", "args": ["-y", "@magicuidesign/mcp@latest"] },
    "reactbits":  { "command": "npx", "args": ["-y", "reactbits-dev-mcp-server"] },
    "aceternity": { "command": "npx", "args": ["-y", "aceternityui-mcp"] },
    "ui-layouts": { "command": "npx", "args": ["-y", "@ui-layouts/mcp"] },
    "shadcn":     { "command": "npx", "args": ["-y", "shadcn@latest", "mcp"] },
    "magic21":    { "command": "npx", "args": ["-y", "@21st-dev/magic@latest"],
                    "env": { "API_KEY": "21st_sk_37dfab7228cda550be37e8217cc7e6ff5be5a8a3f2f397d1c8f966cbcb44cfe0" } }
  }
}
EOF_MCP

# ---- 2) skill crear-paginas -> se escribe en ~/.claude y se copia al proyecto ----
mkdir -p "${USER_SKILL}/references" "${USER_SKILL}/scripts"

cat > "${USER_SKILL}/SKILL.md" <<'EOF_SKILLMD'
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
EOF_SKILLMD

cat > "${USER_SKILL}/references/fuentes.md" <<'EOF_FUENTES'
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
EOF_FUENTES

cat > "${USER_SKILL}/scripts/uiverse.sh" <<'EOF_UIVERSE'
#!/bin/bash
# uiverse.sh — busca y trae el HTML/CSS de elementos de uiverse.io
# Fuente: espejo oficial en GitHub (uiverse-io/galaxy, MIT, ~3800 elementos),
# porque uiverse.io bloquea el fetch directo desde entornos cloud.
#
# Uso:
#   ./uiverse.sh search <término>       # busca por tag/autor/nombre (p.ej. neumorphism, loader, glass)
#   ./uiverse.sh list <categoría>       # lista una categoría: Buttons Cards Checkboxes Forms Inputs
#                                       #   Notifications Patterns Radio-buttons Toggle-switches Tooltips loaders
#   ./uiverse.sh get <autor> <slug>     # imprime HTML y CSS del elemento
#   ./uiverse.sh get-url <url>          # idem desde una URL https://uiverse.io/<autor>/<slug>
set -euo pipefail

CACHE="${UIVERSE_CACHE:-${TMPDIR:-/tmp}/uiverse-galaxy}"
RAW="https://raw.githubusercontent.com/uiverse-io/galaxy/main"
CATS=(Buttons Cards Checkboxes Forms Inputs Notifications Patterns Radio-buttons Toggle-switches Tooltips loaders)

ensure_cache() {
  if [ ! -d "$CACHE/.git" ]; then
    echo ">> Clonando espejo de Uiverse (una vez, ~24MB)..." >&2
    git clone --depth 1 --quiet https://github.com/uiverse-io/galaxy.git "$CACHE"
  fi
}

split_file() { # $1 = archivo .html del elemento
  echo "===== HTML ====="
  sed '/<style>/,$d' "$1"
  echo "===== CSS ====="
  sed -n '/<style>/,/<\/style>/p' "$1" | sed '1d;$d'
}

cmd="${1:-}"; shift || true
case "$cmd" in
  search)
    term="${1:?uso: uiverse.sh search <término>}"
    ensure_cache
    # busca en tags (cabecera de cada archivo), nombre de archivo y autor
    { grep -ril "Tags:.*${term}" "$CACHE" --include='*.html' 2>/dev/null || true
      find "$CACHE" -iname "*${term}*.html" 2>/dev/null || true
    } | sort -u | head -25 | while read -r f; do
      base="$(basename "$f" .html)"; cat_dir="$(basename "$(dirname "$f")")"
      author="${base%_*}"; slug="${base##*_}"
      echo "$cat_dir | autor: $author | slug: $slug | https://uiverse.io/$author/$slug"
    done
    ;;
  list)
    cat_dir="${1:?uso: uiverse.sh list <categoría>}"
    ensure_cache
    ls "$CACHE/$cat_dir" | head -40
    ;;
  get)
    author="${1:?uso: uiverse.sh get <autor> <slug>}"; slug="${2:?falta slug}"
    tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
    if [ -d "$CACHE/.git" ]; then
      f="$(find "$CACHE" -name "${author}_${slug}.html" | head -1)"
      if [ -n "$f" ]; then split_file "$f"; exit 0; fi
    fi
    for cat_dir in "${CATS[@]}"; do
      code="$(curl -s -o "$tmp" -w "%{http_code}" "$RAW/$cat_dir/${author}_${slug}.html")"
      if [ "$code" = 200 ]; then split_file "$tmp"; exit 0; fi
    done
    echo "No encontrado: ${author}/${slug} (¿elemento muy nuevo? el espejo puede ir por detrás del sitio)" >&2
    exit 1
    ;;
  get-url)
    url="${1:?uso: uiverse.sh get-url <url>}"
    path="${url#*uiverse.io/}"; author="${path%%/*}"; slug="${path##*/}"
    exec "$0" get "$author" "$slug"
    ;;
  *)
    grep '^#' "$0" | sed 's/^# \{0,1\}//' | head -12
    exit 1
    ;;
esac
EOF_UIVERSE

cat > "${USER_SKILL}/scripts/pixelperfect.sh" <<'EOF_PIXEL'
#!/bin/bash
# pixelperfect.sh — lista y trae el código (TSX/SVG) de los bloques de
# www.pixel-perfect.space. Fuente: repo público del sitio
# (vansh-nagar/Pixel-Perfect, registry estilo shadcn) vía raw.githubusercontent.com,
# porque el host vivo bloquea el fetch desde entornos cloud.
#
# Uso:
#   ./pixelperfect.sh list                 # lista los 332 bloques
#   ./pixelperfect.sh list-svg             # lista solo los SVG assets (tab svg-assets)
#   ./pixelperfect.sh search <término>     # busca por nombre/descripción
#   ./pixelperfect.sh get <nombre>         # imprime el código del bloque (TSX con SVG inline)
set -euo pipefail

RAW="https://raw.githubusercontent.com/vansh-nagar/Pixel-Perfect/main"
CACHE="${PIXELPERFECT_CACHE:-${TMPDIR:-/tmp}/pixelperfect-registry.json}"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"

ensure_registry() {
  if [ ! -s "$CACHE" ]; then
    curl -sL -A "$UA" "$RAW/registry.json" -o "$CACHE"
  fi
}

cmd="${1:-}"; shift || true
case "$cmd" in
  list)
    ensure_registry
    node -e "const r=require('$CACHE'); for(const i of r.items) console.log(i.name+(i.description?' — '+i.description.slice(0,60):''))"
    ;;
  list-svg)
    ensure_registry
    node -e "const r=require('$CACHE'); for(const i of r.items.filter(i=>(i.files||[]).some(f=>f.path.includes('/svg/')))) console.log(i.name)"
    ;;
  search)
    term="${1:?uso: pixelperfect.sh search <término>}"
    ensure_registry
    node -e "
      const r=require('$CACHE'); const t=process.argv[1].toLowerCase();
      for(const i of r.items) if((i.name+' '+(i.description||'')).toLowerCase().includes(t))
        console.log(i.name+(i.description?' — '+i.description.slice(0,60):''));
    " "$term"
    ;;
  get)
    name="${1:?uso: pixelperfect.sh get <nombre>}"
    tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
    code="$(curl -sL -A "$UA" -o "$tmp" -w "%{http_code}" "$RAW/public/r/${name}.json")"
    if [ "$code" != 200 ]; then echo "No encontrado: $name (usa 'list' o 'search')" >&2; exit 1; fi
    node -e "
      const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
      for(const f of j.files||[]){ console.log('===== '+(f.target||f.path)+' ====='); console.log(f.content); }
      if(j.dependencies&&j.dependencies.length){ console.log('===== dependencias npm ====='); console.log(j.dependencies.join(' ')); }
    " "$tmp"
    ;;
  *)
    grep '^#' "$0" | sed 's/^# \{0,1\}//' | head -11
    exit 1
    ;;
esac
EOF_PIXEL

cat > "${USER_SKILL}/scripts/cursify.sh" <<'EOF_CURSIFY'
#!/bin/bash
# cursify.sh — lista y trae el código de los efectos de cursor de
# cursify.vercel.app (React/Next). Fuente: repo público ui-layouts/cursify.
# OJO: Cursify NO tiene registry shadcn — la instalación es copy-paste:
#   npm install motion clsx tailwind-merge  +  pegar el componente (y su hook si usa uno).
#
# Uso:
#   ./cursify.sh list              # catálogo (37 efectos: id + archivo)
#   ./cursify.sh get <id>          # imprime el TSX del efecto (p.ej. rainbow-cursor, neon-cursor)
#   ./cursify.sh docs <id>         # imprime la página MDX (incluye hooks/utils necesarios)
set -euo pipefail

RAW="https://raw.githubusercontent.com/ui-layouts/cursify/main"
CACHE="${CURSIFY_CACHE:-${TMPDIR:-/tmp}/cursify-docs.ts}"

ensure_catalog() {
  if [ ! -s "$CACHE" ]; then curl -s "$RAW/configs/docs.ts" -o "$CACHE"; fi
}

cmd="${1:-}"; shift || true
case "$cmd" in
  list)
    ensure_catalog
    node -e "
      const s=require('fs').readFileSync(process.argv[1],'utf8');
      const re=/id:\s*'([^']+)'[\s\S]*?filePath:\s*'([^']+)'/g; let m;
      while((m=re.exec(s))) console.log(m[1]+'  ->  '+m[2]);
    " "$CACHE"
    ;;
  get)
    id="${1:?uso: cursify.sh get <id>}"
    ensure_catalog
    fp="$(node -e "
      const s=require('fs').readFileSync(process.argv[1],'utf8');
      const re=/id:\s*'([^']+)'[\s\S]*?filePath:\s*'([^']+)'/g; let m;
      while((m=re.exec(s))) if(m[1]===process.argv[2]){ console.log(m[2]); break; }
    " "$CACHE" "$id")"
    if [ -z "$fp" ]; then echo "id no encontrado: $id (usa 'list')" >&2; exit 1; fi
    curl -s "$RAW/$fp"
    ;;
  docs)
    id="${1:?uso: cursify.sh docs <id>}"
    curl -sf "$RAW/content/components/${id}.mdx" || { echo "sin docs mdx para: $id" >&2; exit 1; }
    ;;
  *)
    grep '^#' "$0" | sed 's/^# \{0,1\}//' | head -10
    exit 1
    ;;
esac
EOF_CURSIFY

chmod +x "${USER_SKILL}/scripts/"*.sh

# copia al proyecto (para que viaje con el repo si se commitea)
mkdir -p "$(dirname "${PROJ_SKILL}")"
cp -r "${USER_SKILL}" "${PROJ_SKILL}"

# ---- 3) nota global para disparo con una sola frase ----
mkdir -p "${HOME_DIR}/.claude"
CLAUDE_MD="${HOME_DIR}/.claude/CLAUDE.md"
MARK="<!-- crear-paginas-skill -->"
if ! grep -qF "$MARK" "$CLAUDE_MD" 2>/dev/null; then
  {
    echo ""
    echo "$MARK"
    echo "Cuando el usuario pida crear, hacer, armar o replicar una pagina, web,"
    echo "landing, portfolio, dashboard, o traer el HTML/CSS de un componente,"
    echo "USA la skill 'crear-paginas' (Skill tool) sin preguntar de nuevo."
  } >> "$CLAUDE_MD"
fi

# ---- blindaje git: la API key no debe filtrarse ----
if [ -d "${TARGET_DIR}/.git" ]; then
  grep -qxF '.mcp.json' "${TARGET_DIR}/.git/info/exclude" 2>/dev/null \
    || echo '.mcp.json' >> "${TARGET_DIR}/.git/info/exclude"
  git -C "${TARGET_DIR}" ls-files --error-unmatch .mcp.json >/dev/null 2>&1 \
    && git -C "${TARGET_DIR}" update-index --skip-worktree .mcp.json 2>/dev/null || true
fi

echo "[setup] .mcp.json (6 servidores) + skill crear-paginas en ~/.claude y en ${TARGET_DIR}"
