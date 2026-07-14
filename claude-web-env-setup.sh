#!/bin/bash
# Setup script para Claude Code on the web.
# Escribe .mcp.json con 6 servidores MCP de UI (incluida la API key de
# 21st.dev) en el repo de CADA sesion -> disponibles en cualquier repo,
# presente o futuro. No necesita variables de entorno aparte.
set -e

TARGET_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
MCP_FILE="${TARGET_DIR}/.mcp.json"

cat > "${MCP_FILE}" <<'JSON'
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
JSON

# Blindaje: evita que la API key se filtre a git en cualquier repo.
if [ -d "${TARGET_DIR}/.git" ]; then
  grep -qxF '.mcp.json' "${TARGET_DIR}/.git/info/exclude" 2>/dev/null \
    || echo '.mcp.json' >> "${TARGET_DIR}/.git/info/exclude"
  git -C "${TARGET_DIR}" ls-files --error-unmatch .mcp.json >/dev/null 2>&1 \
    && git -C "${TARGET_DIR}" update-index --skip-worktree .mcp.json 2>/dev/null || true
fi

echo "[setup] .mcp.json con 6 servidores UI (21st.dev + shadcn incluidos) en ${TARGET_DIR}"
