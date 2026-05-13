import { createFileRoute } from "@tanstack/react-router";
import { Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { Check, Lock, Shield, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/circles")({
  head: () => ({
    meta: [
      { title: "Circles — Cadence" },
      { name: "description", content: "Trusted accountability circles. Proof-based progress, no vanity metrics." },
    ],
  }),
  component: CirclesPage,
});

type Member = {
  id: string;
  name: string;
  initials: string;
  consistency: number;
  state: "peak" | "steady" | "recovery" | "inconsistent";
  lastProof: string;
};

const seed: Member[] = [
  { id: "u1", name: "You", initials: "AX", consistency: 72, state: "steady", lastProof: "Shipped signup screen · 2h ago" },
  { id: "u2", name: "Maya R.", initials: "MR", consistency: 84, state: "peak", lastProof: "3 hr deep work · linear algebra" },
  { id: "u3", name: "Daniel K.", initials: "DK", consistency: 41, state: "recovery", lastProof: "20 min review · accepted MVD" },
  { id: "u4", name: "Sami O.", initials: "SO", consistency: 67, state: "inconsistent", lastProof: "Run · zone 2 · 32 min" },
  { id: "u5", name: "Lin T.", initials: "LT", consistency: 78, state: "steady", lastProof: "Closed 4 of 4 priorities" },
];

export default function CirclesPage() {
  const [members] = useState(seed);
  const sorted = [...members].sort((a, b) => b.consistency - a.consistency);

  return (
    <div className="flex flex-col gap-5 pb-12 lg:gap-7 lg:pb-8">
      <ScreenHeader
        eyebrow="Accountability"
        title="Trusted circles"
        subtitle="Small, intentional groups built around proof of execution — not streaks, leaderboards, or vanity metrics."
        right={
          <Pill tone="accent">
            <Shield className="h-3 w-3" /> 5 members
          </Pill>
        }
      />

      <section className="px-5 lg:px-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <Card className="lg:col-span-2 bg-gradient-surface">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-accent" />
              <div>
                <p className="font-display text-xl text-foreground">Deep Work · Spring cohort</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-[60ch]">
                  Five members. Weekly proof-based check-ins. Recovery support is reciprocal — when someone slips, the circle drops cognitive load instead of pressure.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat label="Avg consistency" value="68%" />
              <Stat label="Recoveries this week" value="2" />
              <Stat label="Proofs shared" value="14" />
            </div>
          </Card>

          <Card>
            <StatLabel>Group rules</StatLabel>
            <ul className="mt-3 space-y-2.5 text-[13px] text-muted-foreground">
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> Share proof, not promises.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> No leaderboards · no streaks.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> Recovery is the standard, not the exception.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> One honest sentence beats five polished ones.</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="px-5 lg:px-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Circle activity</h2>
          <span className="text-[11px] text-muted-foreground">Sorted by consistency · 14d</span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {sorted.map((m) => (
            <MemberRow key={m.id} m={m} />
          ))}
        </div>
      </section>

      <section className="px-5 lg:px-0">
        <Card className="border-dashed">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Invite-only by design</p>
                <p className="mt-1 text-[12px] text-muted-foreground max-w-[50ch]">
                  Circles cap at 6 members. Invite people you trust to keep showing up — not people you want to impress.
                </p>
              </div>
            </div>
            <button className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
              Invite member
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hairline rounded-xl bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="font-display mt-1 text-xl text-foreground">{value}</p>
    </div>
  );
}

function MemberRow({ m }: { m: Member }) {
  const tones: Record<Member["state"], string> = {
    peak: "bg-success/15 text-success",
    steady: "bg-accent/15 text-accent",
    recovery: "bg-warning/15 text-warning",
    inconsistent: "bg-muted text-muted-foreground",
  };
  return (
    <div className="hairline flex items-center gap-3 rounded-2xl bg-card p-4">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-accent text-sm font-semibold text-background">
        {m.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tones[m.state]}`}>{m.state}</span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{m.lastProof}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${m.consistency}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground num-tabular">{m.consistency}%</span>
        </div>
      </div>
    </div>
  );
}
