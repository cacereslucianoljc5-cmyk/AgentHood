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
