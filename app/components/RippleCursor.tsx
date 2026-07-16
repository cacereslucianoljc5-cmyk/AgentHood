"use client";

// Adapted from Cursify's Ripple Cursor (MIT). Ported to plain CSS: Tailwind
// classes swapped for inline styles + a `ripple-cursor` keyframe in
// globals.css, themed green, and throttled by pointer distance so it stays
// subtle instead of firing on every mousemove pixel.
import { useEffect, useReducer, useRef } from "react";

type Ripple = { id: string; x: number; y: number; size: number };
type Action = { type: "add"; payload: Ripple } | { type: "remove"; payload: string };

function reducer(state: Ripple[], action: Action): Ripple[] {
  switch (action.type) {
    case "add":
      return [...state, action.payload].slice(-24);
    case "remove":
      return state.filter((r) => r.id !== action.payload);
    default:
      return state;
  }
}

export default function RippleCursor({
  maxSize = 26,
  duration = 900,
  minDistance = 18,
}: {
  maxSize?: number;
  duration?: number;
  minDistance?: number;
}) {
  const [ripples, dispatch] = useReducer(reducer, []);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // skip on touch

    const onMove = (e: MouseEvent) => {
      const prev = last.current;
      if (prev) {
        const d = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
        if (d < minDistance) return;
      }
      last.current = { x: e.clientX, y: e.clientY };
      const id = `${Date.now()}-${Math.random()}`;
      dispatch({
        type: "add",
        payload: { id, x: e.clientX, y: e.clientY, size: maxSize * (0.7 + Math.random() * 0.6) },
      });
      setTimeout(() => dispatch({ type: "remove", payload: id }), duration);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [maxSize, duration, minDistance]);

  return (
    <div className="ripple-cursor-layer" aria-hidden>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-cursor-dot"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
}
