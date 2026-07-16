#!/usr/bin/env bash
# SessionStart hook — make the `page-toolkit` skill stack available in every
# session of this environment (container reclaims re-seed the home, so this
# reinstalls what the account seed doesn't carry).
#
# Fully idempotent and fail-safe: it never blocks session start, and does
# nothing (fast exit) once the skills are present.
set -u

SK="${HOME:-/root}/.claude/skills"
mkdir -p "$SK" 2>/dev/null || exit 0

# ---- Fast path: everything already installed ----------------------------
if [ -f "$SK/page-toolkit/SKILL.md" ] \
  && [ -f "$SK/color-expert/SKILL.md" ] \
  && [ -f "$SK/test-driven-development/SKILL.md" ]; then
  exit 0
fi

TMP="$(mktemp -d 2>/dev/null || echo "/tmp/pagetoolkit-$$")"
mkdir -p "$TMP" 2>/dev/null

# ---- color-expert (meodai) ---------------------------------------------
if [ ! -f "$SK/color-expert/SKILL.md" ]; then
  if git clone --depth 1 https://github.com/meodai/skill.color-expert.git \
      "$TMP/color-expert" >/dev/null 2>&1; then
    rm -rf "$TMP/color-expert/.git"
    rm -rf "$SK/color-expert"
    cp -r "$TMP/color-expert" "$SK/color-expert"
  fi
fi

# ---- superpowers (obra) — process / TDD / plans skills ------------------
if [ ! -f "$SK/test-driven-development/SKILL.md" ]; then
  if git clone --depth 1 https://github.com/obra/superpowers.git \
      "$TMP/superpowers" >/dev/null 2>&1; then
    for d in "$TMP"/superpowers/skills/*/; do
      n="$(basename "$d")"
      [ -f "$d/SKILL.md" ] || continue
      rm -rf "$SK/$n"
      cp -r "$d" "$SK/$n"
    done
  fi
fi

rm -rf "$TMP" 2>/dev/null

# ---- page-toolkit meta-skill (embedded, no network needed) --------------
mkdir -p "$SK/page-toolkit"
cat > "$SK/page-toolkit/SKILL.md" <<'PTEOF'
---
name: page-toolkit
description: Toolkit combinado para construir páginas y UI con criterio — dirección de diseño distintiva (frontend-design), conocimiento profundo de color (color-expert), la metodología de desarrollo Superpowers (proceso, TDD, planes) y efectos de cursor/fondo de Cursify (React/Next). Úsalo al diseñar/rehacer interfaces, elegir paletas o colores, planear/implementar features, o añadir animaciones de cursor.
---

# Page Toolkit

Meta-skill que combina cuatro cuerpos de conocimiento ya instalados en este
entorno. No re-implementa nada: **carga y sigue** cada pieza según la fase.
Cuando uses page-toolkit, léete la(s) pieza(s) relevante(s) antes de actuar.

## Las cuatro piezas y dónde están

1. **Dirección de diseño distintiva — `frontend-design`**
   `/mnt/skills/public/frontend-design/SKILL.md`
   Para: elegir paleta/tipografía/layout con una tesis, evitar los 3 "defaults
   de diseño IA", decidir el elemento-firma, y el proceso brainstorm → plan →
   crítica → build → crítica.

2. **Conocimiento de color — `color-expert`**
   `~/.claude/skills/color-expert/SKILL.md` (+ `references/` con 140+ archivos)
   Para: construir rampas/tokens en OKLCH, verificar contraste (APCA/WCAG) de
   CADA par texto/fondo en claro y oscuro, mezcla perceptual, y la técnica de
   reparto **70 / 20 / 10** (70% dominante/neutros, 20% secundario, 10% acento).

3. **Metodología de desarrollo — Superpowers** (`~/.claude/skills/…`)
   - `brainstorming` → antes de cualquier feature: explorar intención/requisitos.
   - `writing-plans` / `executing-plans` → plan explícito con checkpoints.
   - `test-driven-development` → tests antes del código.
   - `systematic-debugging` → ante cualquier bug/fallo, antes de proponer fixes.
   - `verification-before-completion` → verificar de verdad antes de declarar hecho.
   - `requesting-code-review` / `receiving-code-review`.
   - `using-superpowers` es el despachador general.

4. **Efectos de cursor/fondo — Cursify** (vía la skill `crear-paginas`)
   `~/.claude/skills/crear-paginas/scripts/cursify.sh list|get|docs`
   37 efectos de cursor React/Next (copy-paste + `npm i motion clsx
   tailwind-merge`). Úsalos con restraint: sutil y elegante, no exagerado.

> Para **traer componentes** de UI (Magic UI, React Bits, Aceternity,
> ui-layouts, shadcn, 21st, Uiverse, Pixel-Perfect) usa la skill
> **`crear-paginas`**, que ya orquesta esas 9 fuentes + 3 galerías.

## Flujo recomendado (combina frontend-design + superpowers)

1. **Brainstorm** (`brainstorming`): fija el sujeto concreto, su público y el
   único trabajo de la página. Extrae el contenido real del brief.
2. **Plan de diseño** (`frontend-design`): token system compacto —
   - **Color**: 4–6 hex nombrados. Reparte con **70/20/10**. Valida contraste
     con `color-expert` (APCA/WCAG) en claro Y oscuro antes de codear.
   - **Tipo**: display característico + body + utility (data/captions).
   - **Layout**: concepto en 1 frase + wireframe ASCII.
   - **Firma**: el único elemento memorable que encarna el brief.
3. **Crítica anti-default** (`frontend-design`): si algo se parece al genérico
   que producirías para cualquier página similar (crema+serif+terracota;
   negro+acento ácido; broadsheet hairline), revísalo y di qué cambiaste.
4. **Plan de implementación** (`writing-plans`) con checkpoints.
5. **Build**: deriva cada color/tipo del plan. Cuida especificidad CSS.
   Motion deliberada (page-load / scroll-reveal / hover / ambiente). Añade
   cursor/fondo con `cursify.sh` si aporta.
6. **Verifica** (`verification-before-completion`): build pasa; screenshots;
   contraste AA; responsive a móvil; foco de teclado visible; reduced-motion
   respetado. "Antes de salir, quítate un accesorio" (recorta 1 decoración).

## Reglas de calidad no negociables (quality floor)
- Contraste: cada par texto/fondo ≥ AA (usa color-expert para medir, no ojímetro).
- Responsive hasta móvil; foco de teclado visible; `prefers-reduced-motion`.
- Copy como material de diseño (voz activa, sentence case, específico > listo).
- Gasta la audacia en UN sitio (el elemento-firma); lo demás, disciplinado.
PTEOF

exit 0
