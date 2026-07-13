#!/bin/bash
# ============================================================================
#  Setup script para Claude Code on the web (entorno en la nube)
#  Pega TODO este contenido en:  Entorno -> Editar -> campo "Setup script"
#
#  Qué hace: escribe un .mcp.json en la raíz del repo clonado de CADA sesión,
#  de modo que los 5 servidores MCP de UI queden disponibles automáticamente
#  en CUALQUIER repo (actual o futuro), sin configurarlos uno por uno.
#
#  Nota sobre 21st.dev Magic: necesita una API key. Añádela como variable de
#  entorno del entorno (campo "Environment variables"):
#      MAGIC_21ST_API_KEY=tu_api_key_de_21st_dev
#  Los otros 4 servidores funcionan sin ninguna key.
# ============================================================================
set -e

# Raíz del repo de la sesión (Claude Code lanza con el repo como working dir).
TARGET_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

cat > "${TARGET_DIR}/.mcp.json" <<'JSON'
{
  "mcpServers": {
    "magicui":    { "command": "npx", "args": ["-y", "@magicuidesign/mcp@latest"] },
    "reactbits":  { "command": "npx", "args": ["-y", "reactbits-dev-mcp-server"] },
    "aceternity": { "command": "npx", "args": ["-y", "aceternityui-mcp"] },
    "ui-layouts": { "command": "npx", "args": ["-y", "@ui-layouts/mcp"] },
    "magic21":    { "command": "npx", "args": ["-y", "@21st-dev/magic@latest"],
                    "env": { "API_KEY": "${MAGIC_21ST_API_KEY}" } }
  }
}
JSON

echo "[setup] .mcp.json con 5 servidores UI escrito en ${TARGET_DIR}"
