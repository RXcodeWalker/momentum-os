import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sunrise, Moon, Zap, RotateCcw, ListPlus, ArrowRight } from "lucide-react";
import type { PrimaryDirective as PrimaryDirectiveType } from "@/lib/today-priority";

const ICONS = {
  "recovery-protocol": RotateCcw,
  calibrate: Sunrise,
  "check-in": Moon,
  "focus-task": Zap,
  "plan-tasks": ListPlus,
  onboarding: ListPlus,
};

const ROUTES: Partial<Record<PrimaryDirectiveType["kind"], string>> = {
  "recovery-protocol": "/recovery",
  "check-in": "/check-in",
  onboarding: "/check-in",
};

type Props = {
  directive: PrimaryDirectiveType;
  onCalibrate?: () => void;
  onFocusTask?: (taskId: string) => void;
};

export function PrimaryDirective({ directive, onCalibrate, onFocusTask }: Props) {
  const Icon = ICONS[directive.kind];
  const route = ROUTES[directive.kind];

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 rounded-2xl bg-foreground/5 border border-foreground/8 px-5 py-4 hover:bg-foreground/8 transition-colors cursor-pointer group"
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-accent font-bold mb-0.5">Now</p>
        <p className="text-sm font-semibold text-foreground truncate">{directive.label}</p>
        {directive.detail && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{directive.detail}</p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-none group-hover:text-accent transition-colors" />
    </motion.div>
  );

  if (route) return <Link to={route}>{inner}</Link>;

  if (directive.kind === "calibrate" && onCalibrate) {
    return (
      <button onClick={onCalibrate} className="w-full text-left">
        {inner}
      </button>
    );
  }

  if (directive.kind === "focus-task" && directive.taskId && onFocusTask) {
    return (
      <button onClick={() => onFocusTask(directive.taskId!)} className="w-full text-left">
        {inner}
      </button>
    );
  }

  return <div>{inner}</div>;
}
