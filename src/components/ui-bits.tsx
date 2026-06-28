"use client";
import { ReactNode, forwardRef } from "react";
import { AnimatedNumber } from "@/lib/motion";
import { motion } from "framer-motion";

// ─── ScreenHeader ────────────────────────────────────────────────────────────
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="px-5 pt-8 pb-4 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="section-label mb-2 text-muted-foreground/70">{eyebrow}</p>
          )}
          <h1 className="font-display text-[32px] leading-[1.06] tracking-tight text-foreground lg:text-[36px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-[38ch] text-[14px] leading-[1.6] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="flex-none">{right}</div>}
      </div>
    </header>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string; style?: React.CSSProperties }
>(function Card({ children, className = "", style }, ref) {
  return (
    <div
      ref={ref}
      className={`card-base ${className}`}
      style={style}
    >
      {children}
    </div>
  );
});

// ─── GhostCard ───────────────────────────────────────────────────────────────
export function GhostCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`card-ghost ${className}`}>
      {children}
    </div>
  );
}

// ─── SectionLabel ────────────────────────────────────────────────────────────
export function StatLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`section-label ${className}`}>
      {children}
    </p>
  );
}

// ─── Pill ────────────────────────────────────────────────────────────────────
export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-secondary text-foreground/80 border border-border",
    accent: "bg-accent/12 text-accent border border-accent/20",
    success: "bg-success/12 text-success border border-success/20",
    warning: "bg-warning/12 text-warning border border-warning/20",
    danger: "bg-danger/12 text-danger border border-danger/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─── Ring ────────────────────────────────────────────────────────────────────
export function Ring({
  value,
  size = 132,
  stroke = 10,
  label,
  sub,
  pulse = true,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  pulse?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={`-rotate-90 ${pulse ? "ring-pulse" : ""}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-glow)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--ring-track)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={clamped}
          className="font-display text-4xl num-tabular text-foreground"
        />
        {label && (
          <span className="section-label mt-1">{label}</span>
        )}
        {sub && <span className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

// ─── Sparkline ───────────────────────────────────────────────────────────────
export function Sparkline({
  data,
  height = 48,
  accent = false,
}: {
  data: number[];
  height?: number;
  accent?: boolean;
}) {
  const w = 280;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / span) * (height - 4) - 2}`)
    .join(" ");
  const area = `0,${height} ${points} ${w},${height}`;
  const stroke = accent ? "var(--sparkline-accent)" : "var(--sparkline-default)";
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <defs>
        <linearGradient id={`sparkFill${accent ? "A" : "B"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sparkFill${accent ? "A" : "B"})`} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── BarRow ──────────────────────────────────────────────────────────────────
export function BarRow({
  label,
  value,
  max = 100,
  tone = "neutral",
}: {
  label: string;
  value: number;
  max?: number;
  tone?: "neutral" | "accent" | "danger";
}) {
  const pct = Math.min(100, (value / max) * 100);
  const bar =
    tone === "accent"
      ? "bg-gradient-accent"
      : tone === "danger"
        ? "bg-danger/80"
        : "bg-foreground/70";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className="num-tabular text-[13px] font-medium text-foreground">{value}</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── IconBadge ───────────────────────────────────────────────────────────────
export function IconBadge({
  children,
  tone = "neutral",
  size = "md",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-secondary text-muted-foreground",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };
  const sizes: Record<string, string> = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-11 w-11 rounded-2xl",
  };
  return (
    <span className={`flex flex-none items-center justify-center ${tones[tone]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// ─── SignalRow ────────────────────────────────────────────────────────────────
// Compact horizontal signal layout: icon + title + optional body + optional aside
export function SignalRow({
  icon,
  title,
  body,
  aside,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  aside?: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}) {
  return (
    <div className="flex items-start gap-3">
      <IconBadge tone={tone} size="md">{icon}</IconBadge>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-snug">{title}</p>
        {body && <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">{body}</p>}
      </div>
      {aside && <div className="flex-none">{aside}</div>}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ className = "" }: { className?: string }) {
  return <div className={`divider ${className}`} />;
}

// ─── InlineLabel ─────────────────────────────────────────────────────────────
export function InlineLabel({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}) {
  const colors: Record<string, string> = {
    neutral: "text-muted-foreground",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };
  return (
    <span className={`section-label ${colors[tone]}`}>{children}</span>
  );
}
