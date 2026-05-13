import { createFileRoute } from "@tanstack/react-router";
import { Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { Check, Clock, Lock, Plus, Shield, Users, Zap } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";

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
};

const MEMBERS: Member[] = [
  { id: "u1", name: "You", initials: "AX", consistency: 72, state: "steady" },
  { id: "u2", name: "Maya R.", initials: "MR", consistency: 84, state: "peak" },
  { id: "u3", name: "Daniel K.", initials: "DK", consistency: 41, state: "recovery" },
  { id: "u4", name: "Sami O.", initials: "SO", consistency: 67, state: "inconsistent" },
  { id: "u5", name: "Lin T.", initials: "LT", consistency: 78, state: "steady" },
];

const MEMBER_NAMES: Record<string, string> = {
  u1: "You",
  u2: "Maya R.",
  u3: "Daniel K.",
  u4: "Sami O.",
  u5: "Lin T.",
};

const MEMBER_INITIALS: Record<string, string> = {
  u1: "AX",
  u2: "MR",
  u3: "DK",
  u4: "SO",
  u5: "LT",
};

const PROOF_TYPE_LABELS: Record<string, { label: string; toneClass: string }> = {
  "deep-work": { label: "Deep work", toneClass: "bg-accent/15 text-accent" },
  movement: { label: "Movement", toneClass: "bg-success/15 text-success" },
  recovery: { label: "Recovery", toneClass: "bg-warning/15 text-warning" },
  milestone: { label: "Milestone", toneClass: "bg-foreground/15 text-foreground" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CirclesPage() {
  const proofs = useApp((s) => s.proofs);
  const addProof = useApp((s) => s.addProof);
  const sorted = [...MEMBERS].sort((a, b) => b.consistency - a.consistency);
  const [submitting, setSubmitting] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofType, setProofType] = useState<"deep-work" | "movement" | "recovery" | "milestone">("deep-work");

  const handleSubmitProof = () => {
    if (!proofText.trim()) return;
    addProof({ memberId: "u1", text: proofText.trim(), type: proofType });
    setProofText("");
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-5 pb-12 lg:gap-7 lg:pb-8">
      <ScreenHeader
        eyebrow="Accountability"
        title="Trusted circles"
        subtitle="Small, intentional groups built around proof of execution — not streaks, leaderboards, or social performance."
        right={
          <Pill tone="accent">
            <Shield className="h-3 w-3" /> 5 members
          </Pill>
        }
      />

      {/* Group overview */}
      <section className="px-5 lg:px-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <Card className="lg:col-span-2 bg-gradient-surface">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-accent flex-none mt-0.5" />
              <div>
                <p className="font-display text-xl text-foreground">Deep Work · Spring cohort</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-[56ch]">
                  Five members. Proof over promises. When someone is in recovery, the circle reduces pressure instead of adding it. This is the system working correctly.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <GroupStat label="Avg consistency" value={`${Math.round(MEMBERS.reduce((a, m) => a + m.consistency, 0) / MEMBERS.length)}%`} />
              <GroupStat label="Recoveries · week" value={String(MEMBERS.filter((m) => m.state === "recovery").length)} />
              <GroupStat label="Proofs shared" value={String(proofs.length)} />
            </div>
          </Card>

          <Card>
            <StatLabel>Circle principles</StatLabel>
            <ul className="mt-3 space-y-2.5 text-[13px] text-muted-foreground">
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> Share proof, not promises.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> No leaderboards. No streaks.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> Recovery is the standard, not the exception.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> One honest sentence beats five polished ones.</li>
              <li className="flex gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-success flex-none" /> Drop load when a member is struggling.</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Proof feed */}
      <section className="px-5 lg:px-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Execution proof feed</h2>
          <button
            onClick={() => setSubmitting((v) => !v)}
            className="flex items-center gap-1.5 hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Share proof
          </button>
        </div>

        {/* Proof submission */}
        {submitting && (
          <Card className="mb-3">
            <StatLabel>Share execution proof</StatLabel>
            <p className="mt-1 text-xs text-muted-foreground mb-3">One honest sentence about what you actually did.</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {(["deep-work", "movement", "recovery", "milestone"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setProofType(t)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    proofType === t ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PROOF_TYPE_LABELS[t].label}
                </button>
              ))}
            </div>
            <input
              autoFocus
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitProof()}
              placeholder="e.g. 2h deep work, linear algebra problem sets done"
              className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSubmitProof}
                disabled={!proofText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
              >
                <Zap className="h-3.5 w-3.5" /> Post proof
              </button>
              <button
                onClick={() => setSubmitting(false)}
                className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}

        <div className="space-y-2.5">
          {proofs.slice(0, 8).map((proof) => {
            const meta = PROOF_TYPE_LABELS[proof.type];
            const name = MEMBER_NAMES[proof.memberId] ?? proof.memberId;
            const initials = MEMBER_INITIALS[proof.memberId] ?? "?";
            const isYou = proof.memberId === "u1";
            return (
              <div key={proof.id} className="hairline flex items-start gap-3 rounded-2xl bg-card p-4">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-accent text-sm font-semibold text-background">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{isYou ? "You" : name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.toneClass}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{proof.text}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                    <Clock className="h-3 w-3" /> {timeAgo(proof.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Member consistency */}
      <section className="px-5 lg:px-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Member consistency</h2>
          <span className="text-[11px] text-muted-foreground">14-day window</span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {sorted.map((m) => (
            <MemberRow key={m.id} m={m} />
          ))}
        </div>
      </section>

      {/* Recovery support note */}
      {MEMBERS.some((m) => m.state === "recovery") && (
        <section className="px-5 lg:px-0">
          <Card className="bg-gradient-to-br from-warning/5 to-transparent border-warning/20 hairline">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-warning flex-none mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Recovery support active</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {MEMBERS.filter((m) => m.state === "recovery").map((m) => m.name).join(", ")} {MEMBERS.filter((m) => m.state === "recovery").length === 1 ? "is" : "are"} in recovery mode. The circle automatically reduces accountability pressure — that&apos;s the system working as designed.
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Invite cap */}
      <section className="px-5 lg:px-0">
        <Card className="border-dashed">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Invite-only by design</p>
                <p className="mt-1 text-[12px] text-muted-foreground max-w-[46ch]">
                  Circles cap at 6 members. Invite people you trust to keep showing up — not people you want to impress.
                </p>
              </div>
            </div>
            <button className="flex-shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
              Invite
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
}

function GroupStat({ label, value }: { label: string; value: string }) {
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
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize flex-shrink-0 ${tones[m.state]}`}>
            {m.state}
          </span>
        </div>
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
