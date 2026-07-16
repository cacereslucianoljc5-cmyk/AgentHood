// Adapted from Uiverse.io (AbanoubMagdy1, MIT) — a 4-circle orbit loader.
// Ported to this project: recolored green, styled via the `.uv-loader` class
// in globals.css instead of the original inline CSS.
export default function UiverseSpinner() {
  return (
    <div className="uv-loader" aria-hidden>
      <span className="uv-circle" />
      <span className="uv-circle" />
      <span className="uv-circle" />
      <span className="uv-circle" />
    </div>
  );
}
