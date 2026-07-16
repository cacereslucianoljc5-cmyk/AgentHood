"use client";

// Globe — adapted from ui-layouts.com/components/globe (cobe).
// Re-tinted to the forest-green brand and given live Robinhood-Chain markers.
import createGlobe from "cobe";
import { useEffect, useRef } from "react";

interface GlobeProps {
  className?: string;
  theta?: number;
  dark?: number;
  scale?: number;
  diffuse?: number;
  mapSamples?: number;
  mapBrightness?: number;
  baseColor?: [number, number, number];
  markerColor?: [number, number, number];
  glowColor?: [number, number, number];
}

export default function Globe({
  className,
  theta = 0.28,
  dark = 1,
  scale = 1.05,
  diffuse = 1.25,
  mapSamples = 42000,
  mapBrightness = 5.2,
  // forest green land, honey markers, soft green glow
  baseColor = [0.16, 0.42, 0.31],
  markerColor = [0.88, 0.63, 0.3],
  glowColor = [0.35, 0.62, 0.46],
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = canvas.offsetWidth || 380;
    let phi = 0;
    let raf = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta,
      dark,
      scale,
      diffuse,
      mapSamples,
      mapBrightness,
      baseColor,
      markerColor,
      glowColor,
      opacity: 1,
      offset: [0, 0],
      markers: [
        { location: [40.7128, -74.006], size: 0.09 }, // NY
        { location: [51.5074, -0.1278], size: 0.06 }, // London
        { location: [1.3521, 103.8198], size: 0.07 }, // Singapore
        { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
        { location: [-23.5505, -46.6333], size: 0.05 }, // Sao Paulo
        { location: [19.076, 72.8777], size: 0.05 }, // Mumbai
        { location: [52.52, 13.405], size: 0.04 }, // Berlin
        { location: [37.7749, -122.4194], size: 0.06 }, // SF
      ],
    });

    // cobe v2 has no onRender: drive the rotation ourselves — unless the
    // visitor prefers reduced motion, in which case the globe stays still.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = () => {
      phi += 0.0035;
      globe.update({ phi });
      raf = requestAnimationFrame(loop);
    };
    if (!still) raf = requestAnimationFrame(loop);

    const onResize = () => {
      width = canvas.offsetWidth || width;
      globe.update({ width: width * 2, height: width * 2 });
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", maxWidth: "100%", aspectRatio: "1" }}
      />
    </div>
  );
}
