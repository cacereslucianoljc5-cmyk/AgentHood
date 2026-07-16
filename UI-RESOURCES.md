# Recursos de UI / Componentes — conectados vía MCP

Este repo incluye un `.mcp.json` que conecta automáticamente **6 servidores MCP**
de librerías de componentes. Claude Code los carga al abrir el proyecto.

## 1. Conectados por MCP (auto)

| Servidor      | Sitio                     | Comando                          | Key |
|---------------|---------------------------|----------------------------------|-----|
| `magicui`     | https://magicui.design    | `npx -y @magicuidesign/mcp`      | No  |
| `reactbits`   | https://reactbits.dev     | `npx -y reactbits-dev-mcp-server`| No¹ |
| `aceternity`  | https://ui.aceternity.com | `npx -y aceternityui-mcp`        | No  |
| `ui-layouts`  | https://www.ui-layouts.com| `npx -y @ui-layouts/mcp`         | No  |
| `shadcn`      | https://ui.shadcn.com     | `npx -y shadcn@latest mcp`       | No  |
| `magic21`     | https://21st.dev          | `npx -y @21st-dev/magic`         | Sí² |

¹ React Bits acepta opcionalmente un `GITHUB_TOKEN` para más rate limit.
² 21st.dev Magic **requiere** API key (`MAGIC_21ST_API_KEY`). En el setup script
  del entorno la key va embebida; el `.mcp.json` de este repo la lee de la env var.
  Consíguela en https://21st.dev/magic/console.

### Cómo usarlos
- "Añade un marquee de logos" (Magic UI)
- "Pon un fondo grid animado" / "texto con blur fade"
- "Genera un card 3D con efecto spotlight" (Aceternity)
- "/ui una tabla de precios con 3 planos y toggle mensual/anual" (21st.dev)
- "Instala el componente button de shadcn" / "añade un pricing section" (shadcn)

### shadcn como puente a otros registries
El servidor `shadcn` instala desde **cualquier registry compatible** (p. ej.
Aceternity: `npx shadcn@latest add https://ui.aceternity.com/registry/<n>.json`).

## 2. Buenas, sin MCP propio — cubiertas por la skill `crear-paginas`

La skill `.claude/skills/crear-paginas` incluye scripts probados que traen el
código de estas fuentes por ti (vía sus repos públicos de GitHub):

- **Cursify** (37 efectos de cursor React) — https://cursify.vercel.app
  → `scripts/cursify.sh list|get|docs`. OJO: **no** tiene registry shadcn
  (verificado); la instalación es copy-paste + `npm i motion clsx tailwind-merge`.
- **Uiverse** (~3800 elementos CSS/Tailwind, MIT) — https://uiverse.io/elements
  → `scripts/uiverse.sh search|list|get|get-url` (espejo `uiverse-io/galaxy`).
- **Pixel Perfect** (332 bloques + SVG assets) — https://www.pixel-perfect.space/blocks
  → `scripts/pixelperfect.sh list|list-svg|search|get` (repo `vansh-nagar/Pixel-Perfect`).

## 3. Inspiración (integradas en la skill vía WebSearch)

La skill las usa en MODO CREAR (cuando no das una página de referencia):

- **Mobbin** (patrones de apps iOS/Android) — https://mobbin.com
  → `WebSearch site:mobbin.com <flujo o patrón>` (títulos+snippets indexados).
- **Rebrand Gallery** (bentos) — https://www.rebrand.gallery/bentos
  → bloqueado para fetch directo; WebSearch equivalente.
- **Craftwork** (webs curadas) — https://craftwork.design/curated/websites
  → receta en `references/fuentes.md` de la skill.

---

## Hacerlos globales en Claude Code web (todos los repos, incl. futuros)

El `.mcp.json` de este repo solo aplica a este repo. Para tenerlos en **cualquier
repo automáticamente**, pega el script `claude-web-env-setup.sh` en el campo
*Setup script* del entorno (Entorno → Editar). Ese script escribe el `.mcp.json`
en cada sesión, sin importar el repo, con la API key de 21st.dev ya embebida.
