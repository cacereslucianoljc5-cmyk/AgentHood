"use client";

import { useEffect, useState } from "react";

type Ratio = "square" | "landscape" | "portrait";

// Client-side daily counter (UX display). Server enforces the real limit.
const IMAGE_LIMIT = 20;

// ---------- Inline SVG icons (inherit color via currentColor) ----------
function IconImage({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function IconDownload({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function useDailyCounter(name: string, max: number) {
  const [used, setUsed] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`hood_${name}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.day === todayKey()) setUsed(p.used);
        else localStorage.removeItem(`hood_${name}`);
      }
    } catch {}
  }, [name]);
  const bump = () => {
    setUsed((u) => {
      const next = u + 1;
      try {
        localStorage.setItem(
          `hood_${name}`,
          JSON.stringify({ day: todayKey(), used: next })
        );
      } catch {}
      return next;
    });
  };
  return { used, remaining: Math.max(0, max - used), bump };
}

function Mascot() {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="mascot-fallback" aria-hidden>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z"
            stroke="var(--neon)"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="12" cy="12" r="3.2" fill="var(--neon)" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="mascot"
      src="/mascot.png"
      alt="AgentHood"
      onError={() => setBroken(true)}
    />
  );
}

function Wordmark() {
  const [broken, setBroken] = useState(false);
  return (
    <div className="wordmark-wrap">
      {broken ? (
        <div className="wordmark">
          <span className="hood">Agent</span>
          <span className="agent">Hood</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="wordmark-img"
          src="/wordmark.jpg"
          alt="AgentHood"
          onError={() => setBroken(true)}
        />
      )}
      <div className="tagline">
        Imagina. <b>Describe</b>. <b>Crea</b>.
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="header">
      <Mascot />
      <Wordmark />
    </header>
  );
}

function ImageTab() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<Ratio>("square");
  const [loading, setLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [error, setError] = useState("");
  const counter = useDailyCounter("image", IMAGE_LIMIT);

  async function generate() {
    const text = prompt.trim();
    if (!text || loading) return;
    if (counter.remaining <= 0) {
      setError("Has alcanzado tu límite diario de imágenes. Vuelve mañana.");
      return;
    }
    setError("");
    setLoading(true);
    setImgUrl("");
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, ratio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Algo salió mal.");
        setLoading(false);
        return;
      }
      // Preload the image so we only stop the spinner when it's ready.
      const im = new window.Image();
      im.onload = () => {
        setImgUrl(data.url);
        counter.bump();
        setLoading(false);
      };
      im.onerror = () => {
        setError("No se pudo generar la imagen. Intenta otra descripción.");
        setLoading(false);
      };
      im.src = data.url;
    } catch {
      setError("Error de red. Revisa tu conexión.");
      setLoading(false);
    }
  }

  const ratios: { key: Ratio; label: string }[] = [
    { key: "square", label: "1:1" },
    { key: "landscape", label: "16:9" },
    { key: "portrait", label: "9:16" },
  ];

  return (
    <div className="panel">
      <div className="limit-pill">
        <IconImage size={15} /> Imágenes hoy: <b>{counter.remaining}</b> / {IMAGE_LIMIT} restantes
      </div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && generate()}
        placeholder="Un astronauta neón montando una moto en Marte, estilo cyberpunk..."
        disabled={loading}
      />
      <div className="img-controls">
        <div className="ratio-group">
          {ratios.map((r) => (
            <button
              key={r.key}
              className={`ratio-btn ${ratio === r.key ? "active" : ""}`}
              onClick={() => setRatio(r.key)}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          className="btn"
          style={{ minHeight: 44 }}
          onClick={generate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Generando..." : "Generar imagen"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="image-stage">
        {loading ? (
          <div style={{ textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 14px" }} />
            <div style={{ color: "var(--text-dim)" }}>
              Creando tu imagen<span className="dots" />
            </div>
          </div>
        ) : imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={prompt} />
        ) : (
          <div className="stage-hint">
            Describe una imagen y pulsa <b>Generar</b>
          </div>
        )}
      </div>
      {imgUrl && !loading && (
        <a className="download" href={imgUrl} target="_blank" rel="noreferrer" download>
          <IconDownload size={15} /> Abrir / descargar imagen
        </a>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div className="wrap">
      <Header />
      <ImageTab />
      <div className="footer">
        AgentHood · Generador de imágenes con IA · límites diarios
        <br />
        Uso responsable — no generes contenido dañino o ilegal.
      </div>
    </div>
  );
}
