import { Compass } from "lucide-react";
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.7 };

interface HelpButtonProps {
  onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ boxShadow: "0 0 20px -4px oklch(0.85 0.16 80 / 0.4)" }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
    >
      <Compass className="h-3 w-3 text-accent" />
      Momentum Guide
      <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">?</kbd>
    </motion.button>
  );
}

export function MobileHelpButton({ onClick }: HelpButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      whileTap={{ scale: 0.93 }}
      className="fixed bottom-[88px] right-4 z-[35] lg:hidden flex items-center gap-2 rounded-full border border-accent/30 bg-card/90 backdrop-blur-sm px-4 py-2.5 shadow-elegant text-[12px] font-medium text-foreground"
      aria-label="Open Momentum Guide"
    >
      <Compass className="h-3.5 w-3.5 text-accent" />
      Guide
    </motion.button>
  );
}
