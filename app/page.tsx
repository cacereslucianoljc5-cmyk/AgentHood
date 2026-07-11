"use client";

import { useEffect, useRef, useState } from "react";

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

function IconUpload({ size = 16 }: { size?: number }) {
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
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
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
  const [refFile, setRefFile] = useState<Blob | null>(null);
  const [refPreview, setRefPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const counter = useDailyCounter("image", IMAGE_LIMIT);

  // Shrink the image in the browser before uploading: keeps the payload small
  // and the vision analysis fast.
  async function downscaleImage(file: File, maxDim = 768): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.85
      )
    );
  }

  async function onPickReference(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > 8_000_000) {
      setError("La imagen de referencia es demasiado grande (máx 8 MB).");
      return;
    }
    setError("");
    let blob: Blob = file;
    try {
      blob = await downscaleImage(file);
    } catch {
      // If canvas processing fails, fall back to the original file.
    }
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefFile(blob);
    setRefPreview(URL.createObjectURL(blob));
  }

  function clearReference() {
    setRefFile(null);
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
      let res: Response;
      if (refFile) {
        // Reference image → send as multipart so the server can host it and
        // run image-to-image (kontext) on Pollinations.
        const form = new FormData();
        form.append("prompt", text);
        form.append("ratio", ratio);
        form.append("image", refFile, "reference.jpg");
        res = await fetch("/api/image", { method: "POST", body: form });
      } else {
        res = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, ratio }),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Algo salió mal.");
        setLoading(false);
        return;
      }
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) {
        // Real edited image returned directly as bytes (kontext).
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        setImgUrl((prev) => {
          if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return objUrl;
        });
        counter.bump();
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Preload the image URL so we only stop the spinner when it's ready.
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

      <div className="ref-row">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onPickReference}
          disabled={loading}
          style={{ display: "none" }}
        />
        {refPreview ? (
          <div className="ref-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={refPreview} alt="Imagen de referencia" />
            <button
              type="button"
              className="ref-remove"
              onClick={clearReference}
              disabled={loading}
              aria-label="Quitar imagen de referencia"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="ref-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <IconUpload size={16} /> Subir imagen de referencia (opcional)
          </button>
        )}
      </div>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && generate()}
        placeholder={
          refFile
            ? "Describe cómo transformar tu imagen (ej. estilo acuarela, fondo neón)..."
            : "Un astronauta neón montando una moto en Marte, estilo cyberpunk..."
        }
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
          {loading ? "Generando..." : refFile ? "Transformar imagen" : "Generar imagen"}
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
