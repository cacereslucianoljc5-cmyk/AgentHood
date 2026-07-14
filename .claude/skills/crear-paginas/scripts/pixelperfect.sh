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
