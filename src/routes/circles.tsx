import { createFileRoute } from "@tanstack/react-router";
import { Card, Pill, Ring, ScreenHeader, StatLabel } from "@/components/ui-bits";
import {
  Check,
  Clock,
  Heart,
  Lock,
  Plus,
  Shield,
  Users,
  Zap,
  Eye,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  useApp,
  useConsistency,
  useUserState,
  ExecutionProof,
  useResilience,
  Member,
} from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Stagger, StaggerItem, TapCard, FadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/circles")({
  head: () => ({
    meta: [
      { title: "Circles — Cadence" },
      {
        name: "description",
        content: "Trusted accountability circles. Proof-based progress, no vanity metrics.",
      },
    ],
  }),
  component: CirclesPage,
});

const PROOF_TYPE_LABELS: Record<string, { label: string; toneClass: string }> = {
  "deep-work": { label: "Deep work", toneClass: "bg-accent/15 text-accent" },
  movement: { label: "Movement", toneClass: "bg-success/15 text-success" },
  recovery: { label: "Recovery", toneClass: "bg-warning/15 text-warning" },
  milestone: { label: "Milestone", toneClass: "bg-foreground/15 text-foreground" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CirclesPage() {
  const proofs = useApp((s) => s.proofs);
  const addProof = useApp((s) => s.addProof);
  const acknowledgeProof = useApp((s) => s.acknowledgeProof);
  const tasks = useApp((s) => s.tasks);
  const storeMembers = useApp((s) => s.members);
  const circle = useApp((s) => s.circle);
  const history = useApp((s) => s.history);
  const myConsistency = useConsistency(14);
  const myState = useUserState();
  const { score: resilience } = useResilience();

  const [submitting, setSubmitting] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofType, setProofType] = useState<ExecutionProof["type"]>("deep-work");
  const [activeTab, setActiveTab] = useState<"feed" | "members">("feed");

  // Derive user's recent activity from history (last 7 days)
  const myRecentActivity = useMemo(() => {
    return history.slice(-7).map((d) => (d.executionScore >= 60 ? 1 : 0));
  }, [history]);

  // Construct members list including the current user
  const members: Member[] = useMemo(
    () => [
      {
        id: "u1",
        name: "You",
        initials: "AX",
        consistency: myConsistency,
        state: (myState.state === "burnout" ? "recovery" : myState.state) as Member["state"],
        lastActive: new Date().toISOString(),
        recentActivity: myRecentActivity,
      },
      ...storeMembers,
    ],
    [myConsistency, myState.state, storeMembers, myRecentActivity],
  );

  const memberLookup = useMemo(() => {
    return members.reduce(
      (acc, m) => {
        acc[m.id] = m;
        return acc;
      },
      {} as Record<string, Member>,
    );
  }, [members]);

  const avgConsistency = Math.round(
    members.reduce((a, m) => a + m.consistency, 0) / members.length,
  );
  const inRecovery = members.filter((m) => m.state === "recovery");

  const handleSubmitProof = () => {
    if (!proofText.trim()) return;
    addProof({ memberId: "u1", text: proofText.trim(), type: proofType });
    setProofText("");
    setSubmitting(false);
  };

  const completedToday = tasks.filter((t) => t.done);
  const hasPostedToday = proofs.some(
    (p) =>
      p.memberId === "u1" && new Date(p.timestamp).toDateString() === new Date().toDateString(),
  );

  const circleStatus =
    avgConsistency > 80 ? "Peak Flow" : avgConsistency > 60 ? "Steady State" : "Recovery Phase";

  return (
    <div className="flex flex-col gap-6 pb-24 lg:gap-8 lg:pb-12">
      <ScreenHeader
        eyebrow="Accountability"
        title="Trusted Circles"
        subtitle={circle.subtitle}
        right={
          <div className="flex -space-x-2">
            {members.map((m) => (
              <div
                key={m.id}
                title={m.name}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-background ring-1 ring-border/20",
                  m.state === "peak"
                    ? "bg-success"
                    : m.state === "recovery"
                      ? "bg-warning"
                      : "bg-accent",
                )}
              >
                {m.initials}
              </div>
            ))}
          </div>
        }
      />

      {/* Circle Pulse Overview */}
      <section className="px-5 lg:px-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <Card className="lg:col-span-8 overflow-hidden relative border-none bg-gradient-to-br from-card to-accent/5">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Users className="h-32 w-32" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="flex-none">
                <Ring
                  value={avgConsistency}
                  size={140}
                  stroke={12}
                  label="Consistency"
                  sub="Circle Avg"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-display text-2xl text-foreground">{circle.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-[42ch]">
                    Your circle is currently at{" "}
                    <span className="text-foreground">{circleStatus}</span>.
                    {inRecovery.length > 0 &&
                      ` ${inRecovery.length} member${inRecovery.length > 1 ? "s" : ""} in recovery — focus on support, not pressure.`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Proofs This Week
                    </span>
                    <span className="text-xl font-display text-foreground">{proofs.length}</span>
                  </div>
                  <div className="h-8 w-px bg-border/40" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Resilience Score
                    </span>
                    <span className="text-xl font-display text-success">{resilience}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-4 bg-background/40 backdrop-blur-sm border-dashed">
            <StatLabel>Support Protocols</StatLabel>
            <div className="mt-4 space-y-3">
              {inRecovery.length > 0 ? (
                inRecovery.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                      <span className="text-xs font-medium text-foreground">{m.name}</span>
                    </div>
                    <button className="rounded-full bg-warning/15 px-3 py-1 text-[10px] font-semibold text-warning hover:bg-warning/25 transition-colors">
                      Signal Support
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Everyone is in active flow. No special protocols required.
                </p>
              )}
              <div className="pt-2 border-t border-border/40 mt-3">
                <button className="w-full flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground group transition-colors">
                  <span>View Circle Charter</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="px-5 lg:px-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "text-sm font-semibold transition-colors",
                activeTab === "feed" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Proof Feed
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={cn(
                "text-sm font-semibold transition-colors",
                activeTab === "members" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Member Roster
            </button>
          </div>

          <button
            onClick={() => setSubmitting(true)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Share Proof
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "feed" ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Stagger className="space-y-3">
                {/* Proof Submission Suggestion */}
                {!hasPostedToday && !submitting && completedToday.length > 0 && (
                  <StaggerItem>
                    <Card className="bg-accent/5 border-accent/20">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Ready to post today&apos;s proof?
                            </p>
                            <p className="text-xs text-muted-foreground">
                              You completed {completedToday.length} tasks today.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSubmitting(true);
                            setProofText(`Completed: ${completedToday[0].label}`);
                          }}
                          className="text-xs font-bold text-accent hover:underline"
                        >
                          Quick Post
                        </button>
                      </div>
                    </Card>
                  </StaggerItem>
                )}

                {/* Proof Submission UI */}
                {submitting && (
                  <StaggerItem>
                    <Card className="relative overflow-hidden ring-2 ring-accent/30">
                      <StatLabel>Share execution proof</StatLabel>
                      <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {(["deep-work", "movement", "recovery", "milestone"] as const).map(
                            (t) => (
                              <button
                                key={t}
                                onClick={() => setProofType(t)}
                                className={cn(
                                  "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
                                  proofType === t
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-secondary text-muted-foreground hover:bg-border",
                                )}
                              >
                                {PROOF_TYPE_LABELS[t].label}
                              </button>
                            ),
                          )}
                        </div>
                        <textarea
                          autoFocus
                          value={proofText}
                          onChange={(e) => setProofText(e.target.value)}
                          placeholder="What did you actually build, ship, or learn?"
                          className="w-full min-h-[80px] rounded-2xl border border-border bg-background/50 p-4 text-sm text-foreground focus:ring-2 focus:ring-accent/20 focus:outline-none resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <Shield className="h-3 w-3" /> Visible to Circle only
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSubmitting(false)}
                              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={!proofText.trim()}
                              onClick={handleSubmitProof}
                              className="rounded-xl bg-foreground px-6 py-2 text-xs font-bold text-background disabled:opacity-30 transition-opacity"
                            >
                              Post Proof
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </StaggerItem>
                )}

                {/* Proof List */}
                {proofs.map((proof) => (
                  <StaggerItem key={proof.id}>
                    <ProofCard
                      proof={proof}
                      isYou={proof.memberId === "u1"}
                      member={memberLookup[proof.memberId]}
                      onWitness={() => acknowledgeProof(proof.id, "u1")}
                      memberLookup={memberLookup}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            </motion.div>
          ) : (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((m) => (
                  <MemberRow key={m.id} m={m} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Circle Constraints Footer */}
      <section className="px-5 lg:px-0 opacity-60 hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between gap-4 py-6 border-t border-border/40">
          <div className="flex items-center gap-4">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div className="text-[11px] text-muted-foreground leading-relaxed max-w-[50ch]">
              This circle is locked at {members.length}/6 members. Private by default. No public
              feed. No algorithmic discovery.
            </div>
          </div>
          <button className="flex-none rounded-full border border-border px-4 py-1.5 text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors">
            Invite Link
          </button>
        </div>
      </section>
    </div>
  );
}

function ProofCard({
  proof,
  isYou,
  member,
  onWitness,
  memberLookup,
}: {
  proof: ExecutionProof;
  isYou: boolean;
  member?: Member;
  onWitness: () => void;
  memberLookup: Record<string, Member>;
}) {
  const meta = PROOF_TYPE_LABELS[proof.type];
  const name = member?.name ?? "Unknown";
  const initials = member?.initials ?? "?";
  const witnesses = proof.acknowledgedBy || [];
  const witnessedByYou = witnesses.includes("u1");

  return (
    <Card className="hover:border-border/60 transition-colors group">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold text-background ring-2 ring-background ring-offset-1 ring-offset-border/10",
            isYou ? "bg-foreground" : "bg-accent",
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  meta.toneClass,
                )}
              >
                {meta.label}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo(proof.timestamp)}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{proof.text}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-1.5">
              {witnesses.slice(0, 3).map((wId) => (
                <div
                  key={wId}
                  className="h-5 w-5 rounded-full border border-background bg-secondary text-[8px] flex items-center justify-center font-bold text-muted-foreground"
                >
                  {memberLookup[wId]?.initials || "?"}
                </div>
              ))}
              {witnesses.length > 3 && (
                <div className="h-5 w-5 rounded-full border border-background bg-secondary text-[8px] flex items-center justify-center font-bold text-muted-foreground">
                  +{witnesses.length - 3}
                </div>
              )}
              {witnesses.length === 0 && (
                <span className="text-[10px] text-muted-foreground/40 italic">
                  Waiting for witness...
                </span>
              )}
            </div>

            {!isYou && (
              <button
                onClick={onWitness}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold transition-all",
                  witnessedByYou
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Eye className={cn("h-3 w-3", witnessedByYou && "fill-accent")} />
                {witnessedByYou ? "Witnessed" : "Witness Proof"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MemberRow({ m }: { m: Member }) {
  const tones: Record<Member["state"], string> = {
    peak: "text-success",
    steady: "text-accent",
    recovery: "text-warning",
    inconsistent: "text-muted-foreground",
  };

  return (
    <TapCard className="hairline bg-card/40 p-5 rounded-3xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent font-display text-lg">
            {m.initials}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{m.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={cn("text-[10px] font-bold uppercase tracking-widest", tones[m.state])}
              >
                {m.state}
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="text-[10px] text-muted-foreground">
                Active {m.lastActive ? timeAgo(m.lastActive) : "unknown"}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-display text-foreground">{m.consistency}%</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
            Consistency
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${m.consistency}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              m.state === "recovery" ? "bg-warning" : "bg-accent",
            )}
          />
        </div>

        <div className="flex justify-between items-center pt-1">
          <div className="flex gap-1.5">
            {m.recentActivity.map((dot, i) => (
              <div
                key={i}
                className={cn("h-1.5 w-1.5 rounded-full", dot ? "bg-accent/40" : "bg-border/20")}
              />
            ))}
          </div>
          {m.state === "recovery" ? (
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-warning">
              <Heart className="h-3 w-3 fill-warning" /> Support Signal
            </button>
          ) : (
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
              Last 7 Days
            </span>
          )}
        </div>
      </div>
    </TapCard>
  );
}
