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
El servidor `shadcn` instala desde **cualquier registry compatible**, no solo
shadcn/ui. Para añadir un registry externo (p. ej. **Cursify**), regístralo en
`components.json` o instala directo por URL:
```bash
npx shadcn@latest add "https://cursify.vercel.app/r/<componente>.json"
```

## 2. Buenas, sin MCP propio

- **Cursify** (animaciones de cursor React) — https://cursify.vercel.app/get-started
  → instalable vía shadcn (ver arriba) o copiando desde los docs.
- **Uiverse** (CSS/Tailwind puro, copy-paste) — https://uiverse.io/elements
  → sin MCP ni CLI: se copia el HTML/CSS del elemento.
- **Pixel Perfect** (bloques + SVG assets) — https://www.pixel-perfect.space/blocks
  → navegar y descargar; los bloques shadcn se pueden instalar por URL si exponen
    su registry JSON.

## 3. Solo referencia / inspiración (sin integración)

- **Mobbin** (patrones de apps iOS/Android, requiere login) — https://mobbin.com
- **Rebrand Gallery** (bentos) — https://www.rebrand.gallery/bentos
- **Craftwork** (webs curadas) — https://craftwork.design/curated/websites

---

## Hacerlos globales en Claude Code web (todos los repos, incl. futuros)

El `.mcp.json` de este repo solo aplica a este repo. Para tenerlos en **cualquier
repo automáticamente**, pega el script `claude-web-env-setup.sh` en el campo
*Setup script* del entorno (Entorno → Editar). Ese script escribe el `.mcp.json`
en cada sesión, sin importar el repo, con la API key de 21st.dev ya embebida.
