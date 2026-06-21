"use client";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

function readCSSVar(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const parsed = parseFloat(val)
  return isNaN(parsed) ? fallback : parsed
}

export function FadeUp({
  children,
  delay = 0,
  className,
  y,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const resolvedY = y ?? readCSSVar('--motion-distance-adaptive', 12)
  const duration = readCSSVar('--motion-duration-adaptive', 0.55)
  return (
    <motion.div
      initial={{ opacity: 0, y: resolvedY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap,
  initialDelay = 0.05,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  initialDelay?: number;
}) {
  const staggerDelay = gap ?? readCSSVar('--motion-stagger-adaptive', 0.06)
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: staggerDelay, delayChildren: initialDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const resolvedY = y ?? readCSSVar('--motion-distance-adaptive', 10)
  const duration = readCSSVar('--motion-duration-adaptive', 0.5)
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: resolvedY },
        show: { opacity: 1, y: 0, transition: { duration, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function TapCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  // Spring stiffness: 260 - (1 - env.motion) * 100; defaults to 260 at motion=1, 160 at motion=0
  const envMotion = readCSSVar('--env-motion', 0.5)
  const stiffness = 260 - (1 - envMotion) * 100
  const spring = { type: "spring" as const, stiffness, damping: 28, mass: 0.7 }
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={spring}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({
  value,
  duration = 1.1,
  className,
  format = (v: number) => Math.round(v).toString(),
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (v: number) => string;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => format(v));
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display}</span>;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={loc.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Unused ref suppressor for hooks that track previous values
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}
