# Recursos de UI / Componentes — conectados vía MCP

Este repo incluye un `.mcp.json` que conecta automáticamente **5 servidores MCP**
de librerías de componentes React. Claude Code los carga al abrir el proyecto.

## 1. Conectados por MCP (auto)

| Servidor      | Sitio                     | Comando                          | Key |
|---------------|---------------------------|----------------------------------|-----|
| `magicui`     | https://magicui.design    | `npx -y @magicuidesign/mcp`      | No  |
| `reactbits`   | https://reactbits.dev     | `npx -y reactbits-dev-mcp-server`| No¹ |
| `aceternity`  | https://ui.aceternity.com | `npx -y aceternityui-mcp`        | No  |
| `ui-layouts`  | https://www.ui-layouts.com| `npx -y @ui-layouts/mcp`         | No  |
| `magic21`     | https://21st.dev          | `npx -y @21st-dev/magic`         | Sí² |

¹ React Bits acepta opcionalmente un `GITHUB_TOKEN` para más rate limit.
² 21st.dev Magic **requiere** API key. Configúrala como variable de entorno
  `MAGIC_21ST_API_KEY` (en local: `export MAGIC_21ST_API_KEY=...`; en la nube:
  campo *Environment variables* del entorno). Consíguela en https://21st.dev.

### Cómo usarlos
Una vez cargados, pídele a Claude cosas como:
- "Añade un marquee de logos" (Magic UI)
- "Pon un fondo grid animado" / "texto con blur fade"
- "Genera un card 3D con efecto spotlight" (Aceternity)
- "/ui una tabla de precios con 3 planos y toggle mensual/anual" (21st.dev)

## 2. Buenas, sin MCP (navegación / copiar-pegar)

- **Cursify** — https://cursify.vercel.app/get-started
- **Uiverse** — https://uiverse.io/elements
- **Pixel Perfect** (bloques + SVG assets) — https://www.pixel-perfect.space/blocks

## 3. Solo referencia / inspiración

- **Mobbin** (patrones de apps iOS/Android) — https://mobbin.com
- **Rebrand Gallery** (bentos) — https://www.rebrand.gallery/bentos
- **Craftwork** (webs curadas) — https://craftwork.design/curated/websites

---

## Hacerlos globales en Claude Code web (todos los repos, incl. futuros)

El `.mcp.json` de este repo solo aplica a este repo. Para tenerlos en **cualquier
repo automáticamente**, pega el script `claude-web-env-setup.sh` en el campo
*Setup script* del entorno (Entorno → Editar). Ese script escribe el `.mcp.json`
en cada sesión, sin importar el repo.
