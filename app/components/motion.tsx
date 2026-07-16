"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  type Variants,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/* ----------------------------------------------------------------
   Stagger + Item — entry animation, element by element per section
   ---------------------------------------------------------------- */
const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Stagger({
  children,
  className,
  style,
  amount = 0.2,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  amount?: number;
  as?: "div" | "section" | "ul" | "header";
}) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </MotionTag>
  );
}

export function Item({
  children,
  className,
  style,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "li" | "span" | "h1" | "h2" | "p" | "a";
}) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag className={className} style={style} variants={itemVariants}>
      {children}
    </MotionTag>
  );
}

/* A single fade-up element (no parent Stagger needed) */
export function FadeUp({
  children,
  className,
  style,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   NumberTicker — counts up on view (magicui, adapted to plain CSS)
   ---------------------------------------------------------------- */
export function NumberTicker({
  value,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
  className,
  style,
  delay = 0,
}: {
  value: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 90 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [isInView, value, delay, motionValue]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent =
            prefix +
            Intl.NumberFormat("en-US", {
              minimumFractionDigits: decimalPlaces,
              maximumFractionDigits: decimalPlaces,
            }).format(Number(latest.toFixed(decimalPlaces))) +
            suffix;
        }
      }),
    [spring, decimalPlaces, prefix, suffix]
  );

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      {prefix}
      {(0).toFixed(decimalPlaces)}
      {suffix}
    </span>
  );
}

/* ----------------------------------------------------------------
   Countdown — live mm:ss timer that resets each round
   ---------------------------------------------------------------- */
export function Countdown({
  seconds = 512,
  className,
  style,
}: {
  seconds?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [t, setT] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => {
      setT((prev) => (prev <= 1 ? seconds : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return (
    <span className={className} style={style}>
      {mm}:{ss}
    </span>
  );
}

export { motion };
