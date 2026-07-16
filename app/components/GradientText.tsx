"use client";

// Adapted from React Bits' Gradient Text (MIT). Ported to plain CSS: an
// animated background-position sweeps a multi-stop gradient clipped to the
// text (yoyo loop), driven by `motion`'s animation frame + motion value.
import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform } from "motion/react";

export default function GradientText({
  children,
  colors = ["#4faa6b", "#6fd08a", "#35c9b3", "#86e05a", "#4faa6b"],
  animationSpeed = 7,
  className = "",
}: {
  children: ReactNode;
  colors?: string[];
  animationSpeed?: number;
  className?: string;
}) {
  const progress = useMotionValue(0);
  const elapsed = useRef(0);
  const last = useRef<number | null>(null);
  const duration = animationSpeed * 1000;

  useAnimationFrame((time) => {
    if (last.current === null) {
      last.current = time;
      return;
    }
    const dt = time - last.current;
    last.current = time;
    elapsed.current += dt;
    const full = duration * 2;
    const c = elapsed.current % full;
    progress.set(c < duration ? (c / duration) * 100 : 100 - ((c - duration) / duration) * 100);
  });

  const backgroundPosition = useTransform(progress, (p) => `${p}% 50%`);

  return (
    <motion.span
      className={className}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "220% 100%",
        backgroundPosition,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        display: "inline-block",
      }}
    >
      {children}
    </motion.span>
  );
}
