import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { X, Search } from "lucide-react";
import {
  HELP_TABS,
  OVERVIEW,
  DAILY_FLOW,
  MISTAKES,
  RULES,
  RECOVERY,
  SHORTCUTS,
  QUICK_START,
  SEARCH_INDEX,
  SEARCH_PLACEHOLDERS,
  type TabId,
  type Cta,
} from "./help-content";
import { Stagger, StaggerItem, TapCard } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { useTaskIntelligence, useStreakContext } from "@/lib/store";

const spring = { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.7 };
const tabSpring = { type: "spring" as const, stiffness: 380, damping: 32 };

// ─── Context-aware default tab ────────────────────────────────────────────────

function useDefaultTab(): TabId {
  const { daysOnApp, checkIns } = useApp();
  const { todayLoadRisk } = useTaskIntelligence();
  const { atRisk } = useStreakContext();

  if (daysOnApp <= 2) return "quick-start";
  if (atRisk) return "recovery";
  if (todayLoadRisk === "overloaded") return "mistakes";
  const recentCheckIns = checkIns.slice(-3);
  if (recentCheckIns.length < 2) return "recovery";
  return "overview";
}

// ─── CtaButton ────────────────────────────────────────────────────────────────

function CtaButton({ cta, onClose }: { cta: Cta; onClose: () => void }) {
  const base =
    cta.variant === "primary"
      ? "inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-background transition-opacity hover:opacity-90"
      : "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-4 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors";

  if (cta.action.type === "navigate") {
    return (
      <Link to={cta.action.to} onClick={onClose} className={base}>
        {cta.label}
      </Link>
    );
  }
  return (
    <button onClick={onClose} className={base}>
      {cta.label}
    </button>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ onClose }: { onClose: () => void }) {
  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <div className="rounded-3xl border border-accent/15 bg-gradient-to-br from-accent/8 to-transparent p-6">
          <p className="font-display italic text-[19px] leading-[1.4] text-foreground">
            "{OVERVIEW.positioning}"
          </p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Four key truths
        </p>
      </StaggerItem>

      {OVERVIEW.truths.map((truth) => {
        const Icon = truth.icon;
        return (
          <StaggerItem key={truth.id}>
            <TapCard className="flex gap-4 rounded-2xl border border-border bg-card/60 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{truth.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {truth.body}
                </p>
              </div>
            </TapCard>
          </StaggerItem>
        );
      })}

      <StaggerItem>
        <div className="flex items-center gap-3 pt-2">
          <CtaButton cta={OVERVIEW.cta} onClose={onClose} />
        </div>
      </StaggerItem>
    </Stagger>
  );
}

// ─── Tab: Daily Flow ──────────────────────────────────────────────────────────

function DailyFlowTab({ onClose }: { onClose: () => void }) {
  return (
    <Stagger className="flex flex-col gap-4">
      <StaggerItem>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          The daily execution loop. Repeat this consistently and Cadence builds an accurate picture
          of your behavioral patterns.
        </p>
      </StaggerItem>

      {DAILY_FLOW.map((step) => {
        const Icon = step.icon;
        return (
          <StaggerItem key={step.step}>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {step.step}
                </div>
                {step.step < DAILY_FLOW.length && (
                  <div className="w-px flex-1 bg-border" style={{ minHeight: 16 }} />
                )}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    {step.time}
                  </span>
                </div>
                <p className="text-[14px] font-semibold text-foreground">{step.action}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {step.detail}
                </p>
                {step.cta && (
                  <div className="mt-3">
                    <CtaButton cta={step.cta} onClose={onClose} />
                  </div>
                )}
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

// ─── Tab: Mistakes ────────────────────────────────────────────────────────────

function MistakesTab({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Stagger className="flex flex-col gap-3">
      <StaggerItem>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          These patterns appear consistently in users who plateau or burn out. Recognizing them
          early is half the fix.
        </p>
      </StaggerItem>

      {MISTAKES.map((mistake) => {
        const Icon = mistake.icon;
        const isOpen = expanded === mistake.id;
        const toneStyles = {
          danger: "border-danger/25 bg-danger/5",
          warning: "border-warning/25 bg-warning/5",
          neutral: "border-border bg-card/60",
        }[mistake.tone];
        const iconStyles = {
          danger: "text-danger",
          warning: "text-warning",
          neutral: "text-muted-foreground",
        }[mistake.tone];

        return (
          <StaggerItem key={mistake.id}>
            <TapCard
              className={`rounded-2xl border p-4 cursor-pointer ${toneStyles}`}
              onClick={() => setExpanded(isOpen ? null : mistake.id)}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconStyles}`} strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{mistake.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{mistake.body}</p>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground border-t border-border/50 pt-3">
                          {mistake.expandedBody}
                        </p>
                        {mistake.cta && (
                          <div className="mt-3">
                            <CtaButton cta={mistake.cta} onClose={onClose} />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-muted-foreground text-lg leading-none shrink-0 mt-0.5"
                >
                  +
                </motion.span>
              </div>
            </TapCard>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

// ─── Tab: Rules ───────────────────────────────────────────────────────────────

function RulesTab() {
  return (
    <Stagger className="flex flex-col gap-4">
      <StaggerItem>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Five principles that separate people who build lasting momentum from those who cycle
          through motivation.
        </p>
      </StaggerItem>

      {RULES.map((rule) => {
        const Icon = rule.icon;
        return (
          <StaggerItem key={rule.id}>
            <TapCard className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/6 to-transparent p-5">
              <div className="absolute top-3 right-3 opacity-10">
                <span className="font-display text-5xl font-bold text-accent">{rule.number}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
              </div>
              <p className="font-display italic text-[16px] leading-snug text-foreground mb-2">
                "{rule.quote}"
              </p>
              <p className="text-[12px] leading-relaxed text-muted-foreground">{rule.body}</p>
            </TapCard>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

// ─── Tab: Recovery Protocol ───────────────────────────────────────────────────

function RecoveryTab({ onClose }: { onClose: () => void }) {
  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <div className="rounded-3xl border border-accent/15 bg-gradient-to-br from-accent/8 via-transparent to-transparent p-6">
          <p className="font-display italic text-[18px] leading-[1.4] text-foreground">
            "{RECOVERY.headline}"
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            {RECOVERY.subheadline}
          </p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          What recovery actually means
        </p>
      </StaggerItem>

      {RECOVERY.principles.map((principle) => {
        const Icon = principle.icon;
        return (
          <StaggerItem key={principle.id}>
            {principle.emotional ? (
              <div className="rounded-2xl border border-border bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  <p className="text-[13px] font-semibold text-foreground">{principle.title}</p>
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            ) : (
              <TapCard className="flex gap-4 rounded-2xl border border-border bg-card/60 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{principle.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              </TapCard>
            )}
          </StaggerItem>
        );
      })}

      <StaggerItem>
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
            The 3-step restart
          </p>
          <div className="flex flex-col gap-3">
            {RECOVERY.protocol.map((step) => (
              <div key={step.step} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                  {step.step}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{step.action}</p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="flex items-center gap-3 pt-1">
          <CtaButton cta={RECOVERY.cta} onClose={onClose} />
        </div>
      </StaggerItem>
    </Stagger>
  );
}

// ─── Tab: Shortcuts ───────────────────────────────────────────────────────────

function ShortcutsTab() {
  return (
    <Stagger className="flex flex-col gap-4">
      <StaggerItem>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Cadence is built for keyboard-first navigation. Learn these three and you'll rarely need
          to reach for the mouse.
        </p>
      </StaggerItem>

      {SHORTCUTS.map((shortcut) => (
        <StaggerItem key={shortcut.label}>
          <TapCard className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex items-center gap-1 shrink-0">
              {shortcut.keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded-lg border border-border bg-secondary px-2 py-1.5 font-mono text-xs text-foreground shadow-sm"
                >
                  {key}
                </kbd>
              ))}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{shortcut.label}</p>
              <p className="text-[12px] text-muted-foreground">{shortcut.description}</p>
            </div>
          </TapCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

// ─── Tab: Quick Start ─────────────────────────────────────────────────────────

function QuickStartTab({ onClose }: { onClose: () => void }) {
  return (
    <Stagger className="flex flex-col gap-5">
      <StaggerItem>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Three steps to build real momentum in your first 24 hours. Don't skip ahead — the sequence
          matters.
        </p>
      </StaggerItem>

      {QUICK_START.map((step) => {
        const Icon = step.icon;
        return (
          <StaggerItem key={step.step}>
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                  {step.step}
                </div>
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="text-[14px] font-semibold text-foreground">{step.title}</p>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground mb-4">{step.body}</p>
              <CtaButton cta={step.cta} onClose={onClose} />
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

// ─── Search Results ───────────────────────────────────────────────────────────

function SearchResults({
  query,
  onTabSelect,
}: {
  query: string;
  onTabSelect: (tab: TabId) => void;
}) {
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q)),
    ).slice(0, 8);
  }, [query]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-[13px] font-medium text-foreground">No results for "{query}"</p>
        <p className="text-[12px] text-muted-foreground">
          Try: "bad day", "planning", "recovery", "score"
        </p>
      </div>
    );
  }

  return (
    <Stagger className="flex flex-col gap-2">
      {results.map((result, i) => {
        const tab = HELP_TABS.find((t) => t.id === result.tabId);
        const TabIcon = tab?.icon;
        return (
          <StaggerItem key={i}>
            <TapCard
              className="flex gap-3 rounded-xl border border-border bg-card/60 p-3 cursor-pointer"
              onClick={() => onTabSelect(result.tabId)}
            >
              {TabIcon && (
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <TabIcon className="h-3 w-3 text-accent" strokeWidth={1.75} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{result.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {result.body.slice(0, 80)}…
                </p>
                <span className="text-[10px] uppercase tracking-[0.12em] text-accent font-medium">
                  {tab?.label}
                </span>
              </div>
            </TapCard>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

// ─── HelpModal ────────────────────────────────────────────────────────────────

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const defaultTab = useDefaultTab();
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Rotate search placeholder
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [open]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setQuery("");
    }
  }, [open, defaultTab]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleTabSelect = (tab: TabId) => {
    setActiveTab(tab);
    setQuery("");
  };

  const renderTabContent = () => {
    if (query.trim()) {
      return <SearchResults query={query} onTabSelect={handleTabSelect} />;
    }
    switch (activeTab) {
      case "overview":
        return <OverviewTab onClose={onClose} />;
      case "daily-flow":
        return <DailyFlowTab onClose={onClose} />;
      case "mistakes":
        return <MistakesTab onClose={onClose} />;
      case "rules":
        return <RulesTab />;
      case "recovery":
        return <RecoveryTab onClose={onClose} />;
      case "shortcuts":
        return <ShortcutsTab />;
      case "quick-start":
        return <QuickStartTab onClose={onClose} />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Panel */}
          <motion.div
            className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-elegant"
            style={{ maxHeight: "85dvh" }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/40 to-accent/10">
                  <div className="h-3 w-3 rounded-full bg-accent/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-none">
                    Momentum Guide
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Execution operating manual
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={SEARCH_PLACEHOLDERS[placeholderIdx]}
                  className="w-full rounded-xl border border-border bg-secondary/60 py-1.5 pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
                />
              </div>

              <button
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab strip */}
            {!query.trim() && (
              <div className="shrink-0 overflow-x-auto border-b border-border">
                <LayoutGroup id="help-tab-indicator">
                  <div className="flex gap-0.5 px-4 py-2">
                    {HELP_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabSelect(tab.id)}
                          className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="help-tab-indicator"
                              className="absolute inset-0 -z-10 rounded-xl bg-secondary"
                              transition={tabSpring}
                            />
                          )}
                          <Icon
                            className={`h-3 w-3 ${isActive ? "text-accent" : ""}`}
                            strokeWidth={1.75}
                          />
                          {tab.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </LayoutGroup>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={query.trim() ? `search-${query}` : activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
