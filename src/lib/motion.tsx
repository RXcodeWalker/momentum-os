"use client";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

const spring = { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.7 };

export function FadeUp({
  children,
  delay = 0,
  className,
  y = 12,
}: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap = 0.06,
  initialDelay = 0.05,
}: { children: ReactNode; className?: string; gap?: number; initialDelay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: initialDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 10 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
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
}: { children: ReactNode; className?: string; onClick?: () => void }) {
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
}: { value: number; duration?: number; className?: string; format?: (v: number) => string }) {
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
