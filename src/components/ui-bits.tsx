import { ReactNode } from "react";

export function ScreenHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="px-5 pt-8 pb-5 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          )}
          <h1 className="font-display text-[34px] leading-[1.05] text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hairline rounded-3xl bg-card p-5 ${className}`}>{children}</div>
  );
}

export function StatLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{children}</p>;
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "danger" }) {
  const tones: Record<string, string> = {
    neutral: "bg-secondary text-foreground",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Ring({ value, size = 132, stroke = 10, label, sub }: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(value, 0), 100) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.16 80)" />
            <stop offset="100%" stopColor="oklch(0.7 0.16 30)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl num-tabular text-foreground">{Math.round(value)}</span>
        {label && <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{label}</span>}
        {sub && <span className="text-[10px] text-muted-foreground/80 mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

export function Sparkline({ data, height = 48, accent = false }: { data: number[]; height?: number; accent?: boolean }) {
  const w = 280;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / span) * (height - 4) - 2}`).join(" ");
  const area = `0,${height} ${points} ${w},${height}`;
  const stroke = accent ? "oklch(0.85 0.16 80)" : "oklch(0.98 0.003 270)";
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={`sparkFill${accent ? "A" : "B"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sparkFill${accent ? "A" : "B"})`} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarRow({ label, value, max = 100, tone = "neutral" }: { label: string; value: number; max?: number; tone?: "neutral" | "accent" | "danger" }) {
  const pct = Math.min(100, (value / max) * 100);
  const bar = tone === "accent" ? "bg-gradient-accent" : tone === "danger" ? "bg-danger/80" : "bg-foreground/80";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num-tabular text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%`, transition: "width 0.8s cubic-bezier(0.2,0.8,0.2,1)" }} />
      </div>
    </div>
  );
}
