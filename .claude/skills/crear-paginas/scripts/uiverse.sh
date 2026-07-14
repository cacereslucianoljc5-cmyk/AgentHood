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
