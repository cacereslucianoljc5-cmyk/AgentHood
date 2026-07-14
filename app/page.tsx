"use client";

import { useEffect, useRef, useState } from "react";

type Ratio = "square" | "landscape" | "portrait";

// Client-side daily counter (UX display). Server enforces the real limit.
const IMAGE_LIMIT = 20;

// Tap-to-earn: every TAPS_PER_POINT taps grants 1 bonus image credit.
const TAPS_PER_POINT = 50;

// ---------- Shared bonus-credits store (localStorage + live events) ----------
// Credits earned by tapping are persistent and shared across components: the
// image counter reads them and the tap game writes them, kept in sync via a
// window event so both re-render together.
const CREDITS_EVENT = "hood-credits";

function readCredits(): { taps: number; credits: number } {
  try {
    const taps = Number(localStorage.getItem("hood_taps") || 0);
    const credits = Number(localStorage.getItem("hood_credits") || 0);
    return { taps: taps || 0, credits: credits || 0 };
  } catch {
    return { taps: 0, credits: 0 };
  }
}

function writeCredits(taps: number, credits: number) {
  try {
    localStorage.setItem("hood_taps", String(taps));
    localStorage.setItem("hood_credits", String(credits));
  } catch {}
  window.dispatchEvent(new CustomEvent(CREDITS_EVENT, { detail: { taps, credits } }));
}

function useCredits() {
  const [state, setState] = useState({ taps: 0, credits: 0 });
  useEffect(() => {
    setState(readCredits());
    const onChange = (e: Event) => {
      const d = (e as CustomEvent).detail as { taps: number; credits: number };
      setState(d ?? readCredits());
    };
    window.addEventListener(CREDITS_EVENT, onChange);
    return () => window.removeEventListener(CREDITS_EVENT, onChange);
  }, []);

  const addTap = () => {
    const cur = readCredits();
    let taps = cur.taps + 1;
    let credits = cur.credits;
    let earned = false;
    if (taps >= TAPS_PER_POINT) {
      taps -= TAPS_PER_POINT;
      credits += 1;
      earned = true;
    }
    writeCredits(taps, credits);
    return earned;
  };

  const spendCredit = () => {
    const cur = readCredits();
    if (cur.credits <= 0) return false;
    writeCredits(cur.taps, cur.credits - 1);
    return true;
  };

  return { ...state, addTap, spendCredit };
}

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

function IconEdit({ size = 16 }: { size?: number }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function IconFlame({ size = 16 }: { size?: number }) {
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
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
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

// ---------- Feature-chip icons ----------
function IconBolt({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconBrain({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z" />
    </svg>
  );
}
function IconSparkles({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
      <path d="M19 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9z" />
    </svg>
  );
}
function IconLock({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ---------- Brand logo (green leaf / arrow mark, Robinhood-style) ----------
function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="12" y1="52" x2="52" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6fd24e" />
          <stop offset="0.5" stopColor="#c6f24e" />
          <stop offset="1" stopColor="#e2ff6c" />
        </linearGradient>
      </defs>
      {/* feather / leaf body */}
      <path
        d="M54.6 8.4C29.2 11.7 12.4 29 10 53.6c-.2 1.8 2 2.8 3.3 1.5C33 36 45.6 24 56.4 12.1c1.6-1.7-.4-4-1.8-3.7z"
        fill="url(#lg)"
      />
      {/* central spine */}
      <path
        d="M49 14.5C34 27 20.5 40.5 12.6 54"
        stroke="#0c2411"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* barbs */}
      <path
        d="M41 22l-8 3M35 30l-9 3.4M28.5 38l-8.4 3.6"
        stroke="#0c2411"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.28"
      />
    </svg>
  );
}

// ---------- Animated background reacting to scroll + clicks ----------
function BgFX() {
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--sy", `${window.scrollY}px`);
        raf = 0;
      });
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Don't ripple on interactive controls to avoid distraction.
      if (t.closest("button, a, input, textarea, label")) return;
      const r = document.createElement("span");
      r.className = "ripple";
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 950);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="bgfx" aria-hidden>
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="grid" />
    </div>
  );
}

function Topbar() {
  return (
    <div className="topbar">
      <div className="brand">
        <Logo className="logo" />
        <div className="name">
          Agent<b>Hood</b>
        </div>
      </div>
      <div className="chain-badge">
        <span className="dot" /> Robinhood Chain
      </div>
    </div>
  );
}

function Hero() {
  const features = [
    { icon: <IconBolt />, label: "Instant answers" },
    { icon: <IconBrain />, label: "Understands your context" },
    { icon: <IconSparkles />, label: "Ideas that drive you" },
    { icon: <IconLock />, label: "Privacy first" },
  ];
  return (
    <>
      <section className="hero">
        <div className="hero-logo">
          <Logo />
        </div>
        <div>
          <h1>
            Your mind. <span className="grad">Our AI.</span>
            <br />
            Extraordinary results.
          </h1>
          <p className="sub">
            Turn a single sentence into a finished image — or drop in a reference
            and let the AI <b>edit it</b> for you. Free, fast, no sign-up.
          </p>
          <div className="divider" />
        </div>
      </section>

      <div className="features">
        {features.map((f) => (
          <div className="feature" key={f.label}>
            {f.icon}
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      <div className="slogan">
        <span className="w">ASK.</span> <span className="g">CREATE.</span>{" "}
        <span className="w">ACHIEVE.</span> <span className="g">WITHOUT LIMITS.</span>
      </div>
    </>
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
  const editorRef = useRef<HTMLDivElement>(null);
  const counter = useDailyCounter("image", IMAGE_LIMIT);
  const credits = useCredits();
  const effectiveRemaining = counter.remaining + credits.credits;

  // Consume one generation: use a daily slot first, then a tapped bonus credit.
  function consumeOne() {
    if (counter.remaining > 0) counter.bump();
    else credits.spendCredit();
  }

  // Shrink the image in the browser before uploading: keeps the payload small
  // and the vision analysis fast.
  async function downscaleImage(file: File, maxDim = 480): Promise<Blob> {
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
      setError("The file must be an image.");
      return;
    }
    if (file.size > 8_000_000) {
      setError("The reference image is too large (max 8 MB).");
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

  // Carga la imagen de un token (memecoin) como imagen de referencia del editor.
  async function loadReferenceFromUrl(imageUrl: string) {
    setError("");
    try {
      const res = await fetch(`/api/token-image?url=${encodeURIComponent(imageUrl)}`);
      if (!res.ok) throw new Error("img");
      const raw = await res.blob();
      const file = new File([raw], "token.png", { type: raw.type || "image/png" });
      let blob: Blob = file;
      try {
        blob = await downscaleImage(file);
      } catch {
        // usa el original si el canvas falla
      }
      if (refPreview) URL.revokeObjectURL(refPreview);
      setRefFile(blob);
      setRefPreview(URL.createObjectURL(blob));
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("Couldn't load the token image. Try another one.");
    }
  }

  async function generate() {
    const text = prompt.trim();
    if (!text || loading) return;
    if (effectiveRemaining <= 0) {
      setError("You've reached your daily limit. Tap the coin below to earn more.");
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
        setError(data.error || "Something went wrong.");
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
        consumeOne();
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Preload the image URL so we only stop the spinner when it's ready.
      const im = new window.Image();
      im.onload = () => {
        setImgUrl(data.url);
        consumeOne();
        setLoading(false);
      };
      im.onerror = () => {
        setError("Couldn't generate the image. Try another description.");
        setLoading(false);
      };
      im.src = data.url;
    } catch {
      setError("Network error. Check your connection.");
      setLoading(false);
    }
  }

  const ratios: { key: Ratio; label: string }[] = [
    { key: "square", label: "1:1" },
    { key: "landscape", label: "16:9" },
    { key: "portrait", label: "9:16" },
  ];

  return (
    <>
    <div className="section-head">
      <IconImage size={22} />
      <h2>AI Image Studio</h2>
      <span className="sub">generate &amp; edit</span>
    </div>
    <div className="panel" ref={editorRef}>
      <div className="limit-pill">
        <IconImage size={15} /> Images today: <b>{counter.remaining}</b> / {IMAGE_LIMIT} left
        {credits.credits > 0 && (
          <span className="bonus-pill">
            <IconBolt size={13} /> +{credits.credits} earned
          </span>
        )}
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
            <IconUpload size={16} /> Upload a reference image (optional)
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
            ? "Describe how to transform your image (e.g. watercolor style, neon background)..."
            : "A neon astronaut riding a motorcycle on Mars, cyberpunk style..."
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
          {loading ? "Generating..." : refFile ? "Transform image" : "Generate image"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="image-stage">
        {loading ? (
          <div style={{ textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 14px" }} />
            <div style={{ color: "var(--text-dim)" }}>
              Creating your image<span className="dots" />
            </div>
          </div>
        ) : imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={prompt} />
        ) : (
          <div className="stage-hint">
            Describe an image and hit <b>Generate</b>
          </div>
        )}
      </div>
      {imgUrl && !loading && (
        <a className="download" href={imgUrl} target="_blank" rel="noreferrer" download>
          <IconDownload size={15} /> Open / download image
        </a>
      )}
    </div>
    <TokenFeed onUse={loadReferenceFromUrl} />
    </>
  );
}

type TokenInfo = {
  name: string;
  symbol: string;
  imageUrl: string;
  address?: string;
  banner?: boolean;
  priceUsd: string | null;
  change24h: number | null;
  createdAt: string | null;
  url: string;
};

function tokenImg(url: string) {
  return `/api/token-image?url=${encodeURIComponent(url)}`;
}

// Genera un "jazzicon" SVG determinista (estilo MetaMask: color base + formas
// giradas de colores) para tokens sin logo. Se ve como un icono real.
function identiconUri(seed: string): string {
  let s = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    s ^= seed.charCodeAt(i);
    s = Math.imul(s, 16777619) >>> 0;
  }
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 0xffffffff;
  };
  const baseHue = Math.floor(rnd() * 360);
  const bg = `hsl(${baseHue} 68% 52%)`;
  let shapes = "";
  for (let i = 0; i < 4; i++) {
    const hue = (baseHue + Math.floor((rnd() * 2 - 1) * 150) + 360) % 360;
    const col = `hsl(${hue} 72% ${44 + Math.floor(rnd() * 22)}%)`;
    const tx = Math.floor((rnd() * 2 - 1) * 60);
    const ty = Math.floor((rnd() * 2 - 1) * 60);
    const rot = Math.floor(rnd() * 360);
    shapes += `<rect x='-16' y='-16' width='96' height='96' fill='${col}' transform='translate(${tx} ${ty}) rotate(${rot} 32 32)'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='${bg}'/>${shapes}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Muestra la imagen del token y, si falla la carga, cae a un avatar de letras.
function TokenMedia({
  token,
  onUse,
  big,
}: {
  token: TokenInfo;
  onUse: (imageUrl: string) => void;
  big?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [token.imageUrl]);

  if (!token.imageUrl || broken) {
    const seed = token.address || `${token.symbol}${token.name}`;
    return (
      <div
        className={`token-avatar${big ? " big" : ""}`}
        style={{
          backgroundImage: `url("${identiconUri(seed)}")`,
          backgroundSize: "cover",
        }}
        aria-label={token.name}
      />
    );
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={token.banner ? "tok-banner" : undefined}
        src={tokenImg(token.imageUrl)}
        alt={token.name}
        onError={() => setBroken(true)}
      />
      {!big && (
        <button
          className="token-usebtn"
          onClick={() => onUse(token.imageUrl)}
          title="Load into editor"
          aria-label={`Edit ${token.symbol || token.name}`}
        >
          <IconEdit size={14} />
        </button>
      )}
    </>
  );
}

function TokenFeed({ onUse }: { onUse: (imageUrl: string) => void }) {
  const [mode, setMode] = useState<"trending" | "new">("trending");
  const [win, setWin] = useState<"1h" | "6h" | "24h">("24h");
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const qs = mode === "new" ? `mode=new&window=${win}` : "mode=trending";
        const res = await fetch(`/api/tokens?${qs}`);
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setError(data.error || "No se pudieron cargar los tokens.");
          setTokens([]);
        } else {
          setError("");
          setTokens(data.tokens || []);
        }
      } catch {
        if (alive) setError("Error de red al cargar tokens.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 30000); // refresco en tiempo real
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [mode, win]);

  const filters: { key: string; label: string }[] = [
    { key: "trending", label: "Trending" },
    { key: "1h", label: "1h" },
    { key: "6h", label: "6h" },
    { key: "24h", label: "24h" },
  ];
  const active = mode === "trending" ? "trending" : win;
  function selectFilter(k: string) {
    if (k === "trending") setMode("trending");
    else {
      setMode("new");
      setWin(k as "1h" | "6h" | "24h");
    }
  }

  const featured = tokens[0];
  const rest = tokens.slice(1);

  return (
    <div className="token-feed">
      <div className="token-head">
        <h2>
          <IconFlame size={18} /> Hood Trending
        </h2>
        <span className="token-sub">Live memecoins · tap to edit</span>
      </div>

      <div className="token-filters">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`token-filter ${active === f.key ? "active" : ""}`}
            onClick={() => selectFilter(f.key)}
          >
            {f.key === "trending" && <IconFlame size={14} />}
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}
      {loading && tokens.length === 0 && (
        <div className="token-loading">
          <div className="spinner" />
        </div>
      )}
      {!loading && !error && tokens.length === 0 && (
        <div className="stage-hint">No tokens in this window.</div>
      )}

      {featured && (
        <div className="token-featured">
          <TokenMedia token={featured} onUse={onUse} big />
          <div className="token-featured-info">
            <div className="token-name">
              {featured.name} <span>{featured.symbol}</span>
            </div>
            {featured.priceUsd && (
              <div className="token-price">
                ${Number(featured.priceUsd).toPrecision(4)}
                {featured.change24h != null && (
                  <span className={featured.change24h >= 0 ? "up" : "down"}>
                    {featured.change24h >= 0 ? " ▲" : " ▼"}
                    {Math.abs(featured.change24h).toFixed(1)}%
                  </span>
                )}
              </div>
            )}
            {featured.imageUrl && (
              <button className="btn token-use" onClick={() => onUse(featured.imageUrl)}>
                <IconEdit size={15} /> Edit this image
              </button>
            )}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="token-grid">
          {rest.map((t, i) => (
            <div className="token-card" key={`${t.symbol}-${i}`}>
              <div className="token-thumb">
                <TokenMedia token={t} onUse={onUse} />
              </div>
              <div className="token-card-name">{t.symbol || t.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Tap to Earn ----------
// A round logo coin at the bottom: every TAPS_PER_POINT taps grants a bonus
// image credit that the studio above can spend once the daily limit is used up.
function TapToEarn() {
  const credits = useCredits();
  const [pop, setPop] = useState(false);
  const [flash, setFlash] = useState(false);

  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - credits.taps / TAPS_PER_POINT);

  function onTap() {
    const earned = credits.addTap();
    setPop(true);
    setTimeout(() => setPop(false), 130);
    if (earned) {
      setFlash(true);
      setTimeout(() => setFlash(false), 900);
    }
  }

  return (
    <div className="tap-section">
      <div className="section-head">
        <IconBolt size={22} />
        <h2>Tap to Earn</h2>
        <span className="sub">free image credits</span>
      </div>
      <div className="tap-card">
        <button
          type="button"
          className={`coin${pop ? " pop" : ""}${flash ? " flash" : ""}`}
          onClick={onTap}
          aria-label="Tap the coin to earn image credits"
        >
          <svg className="coin-ring" viewBox="0 0 120 120" aria-hidden>
            <circle className="track" cx="60" cy="60" r={R} />
            <circle
              className="prog"
              cx="60"
              cy="60"
              r={R}
              style={{ strokeDasharray: CIRC, strokeDashoffset: offset }}
            />
          </svg>
          <span className="coin-face">
            <Logo className="coin-logo" />
          </span>
        </button>
        <div className="tap-info">
          <div className="tap-count">
            {credits.taps} <span>/ {TAPS_PER_POINT} taps</span>
          </div>
          <div className="tap-earned">
            <IconBolt size={15} /> <b>{credits.credits}</b> image credits earned
          </div>
          <div className="tap-hint">
            Every {TAPS_PER_POINT} taps = <b>1 free image</b>. Tap the coin!
          </div>
          {flash && <div className="tap-flash">+1 credit!</div>}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <BgFX />
      <Topbar />
      <div className="app">
        <Hero />
        <ImageTab />
        <TapToEarn />
        <div className="footer">
          AgentHood · AI image generator · daily limits
          <br />
          Use responsibly — don&apos;t generate harmful or illegal content.
        </div>
      </div>
    </>
  );
}
