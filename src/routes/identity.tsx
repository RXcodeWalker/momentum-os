import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { Activity, Anchor, Compass, Focus, Settings, Shield } from "lucide-react";

export const Route = createFileRoute("/identity")({
  head: () => ({
    meta: [
      { title: "Identity — Cadence" },
      { name: "description", content: "Your evolving operating profile: reliability, resilience, focus, discipline." },
    ],
  }),
  component: Identity,
});

const traits = [
  { icon: Anchor, label: "Reliability", value: 72, delta: "+6", note: "You follow through on commitments to yourself 72% of the time." },
  { icon: Activity, label: "Execution consistency", value: 68, delta: "+4", note: "Daily execution score variance is shrinking — you're getting more predictable." },
  { icon: Shield, label: "Resilience", value: 81, delta: "+11", note: "You return to baseline 1.4 days after a setback. Two weeks ago: 3.1 days." },
  { icon: Focus, label: "Focus quality", value: 64, delta: "−2", note: "Deep work sessions average 38 min before first distraction. Aim for 50." },
  { icon: Compass, label: "Discipline trend", value: 76, delta: "+8", note: "You've held your evening protocol on 9 of last 14 nights." },
];

function Identity() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow="Operating profile · v0.14"
        title="Who you are becoming."
        subtitle="Not a level. Not points. The actual evolution of how you operate."
        right={
          <button className="hairline flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </button>
        }
      />

      <section className="px-5">
        <Card className="bg-gradient-surface">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground text-background font-display text-2xl">
                A
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                72
              </span>
            </div>
            <div>
              <p className="font-display text-xl text-foreground">Alex Mercer</p>
              <p className="text-xs text-muted-foreground">Builder · 84 days on Cadence</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone="accent">Recovering well</Pill>
                <Pill>Morning archetype</Pill>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-5 space-y-2.5">
        {traits.map((t, i) => {
          const Icon = t.icon;
          const up = t.delta.startsWith("+");
          return (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <span className={`num-tabular text-xs ${up ? "text-success" : "text-danger"}`}>{t.delta} 4w</span>
                  </div>
                  <div className="mt-2.5">
                    <BarRow label="" value={t.value} tone="accent" />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t.note}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="px-5">
        <Card className="bg-gradient-surface">
          <StatLabel>Identity arc · last 12 weeks</StatLabel>
          <p className="font-display mt-2 text-lg leading-snug text-foreground">
            You're moving from <span className="text-muted-foreground">"motivated when inspired"</span> toward <span className="text-gradient">"reliable by default."</span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Resilience and discipline are climbing fastest. Focus quality is the lagging dimension — it's the next leverage point.
          </p>
        </Card>
      </section>

      <section className="px-5">
        <Link to="/onboarding" className="block">
          <button className="hairline w-full rounded-2xl bg-card py-3.5 text-sm font-medium text-foreground hover:bg-secondary">
            Recalibrate goals & struggles
          </button>
        </Link>
      </section>
    </div>
  );
}
