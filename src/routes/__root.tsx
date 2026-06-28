import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Hop as Home, ClipboardCheck, LifeBuoy, ChartBar as BarChart3, User, LayoutDashboard, Users, Crown, Calendar, Clock } from "lucide-react";
import { useApp, useUserState, useNavSignals } from "@/lib/store";
import { isSnapshotStale, computeAllSnapshots } from "@/lib/history-engine";
import { useFocusEnvironment } from "@/hooks/internal/useFocusEnvironment";
import { EnvironmentRenderer } from "@/components/environment/EnvironmentRenderer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hydrateFromDB } from "@/lib/sync";
import { AuroraBackground } from "@/components/atmosphere/AuroraBackground";
import { CommandPalette, CommandHint } from "@/components/command/CommandPalette";
import { HelpModal, HelpButton, MobileHelpButton } from "@/components/help";
import { SaveProgressBanner } from "@/components/SaveProgressBanner";
import { PageTransition } from "@/lib/motion";
import { Toaster } from "sonner";
import { motion, LayoutGroup } from "framer-motion";
import { ThemeToggle, useTheme } from "@/components/ThemeToggle";
import { AdaptationDebugOverlay } from "@/components/debug/AdaptationDebugOverlay";
import { FocusOverlay } from "@/components/focus/FocusOverlay";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">This screen doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Cadence — Behavioral OS for ambitious people" },
      {
        name: "description",
        content:
          "Recover from inconsistency, prevent motivation crashes, and build reliable execution. A psychologically aware productivity system.",
      },
      { name: "theme-color", content: "#0a0a0c" },
      { property: "og:title", content: "Cadence — Behavioral OS" },
      {
        property: "og:description",
        content: "A behavioral operating system for ambitious people.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Geist is preferred (self-hosted from /public/fonts/ when present);
      // Inter + JetBrains Mono ride along as named fallbacks until the
      // WOFF2 files land. Instrument Serif remains the display face.
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Bebas+Neue&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('cadence-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.classList.add(t);
    if (t === 'dark') document.documentElement.classList.remove('light');
    if (t === 'light') document.documentElement.classList.remove('dark');
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import type { RouteKey } from "@/lib/maturity";
import { useVisibleRoutes } from "@/lib/maturity";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  gate?: RouteKey;
};

const primaryNav: readonly NavItem[] = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, gate: "this-week" },
  { to: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { to: "/insights", label: "Insights", icon: BarChart3, gate: "patterns" },
  { to: "/weekly", label: "Weekly", icon: Calendar, gate: "this-week" },
  { to: "/replay", label: "Replay", icon: Clock, gate: "replay" },
  { to: "/recovery", label: "Recovery", icon: LifeBuoy },
  { to: "/circles", label: "Circles", icon: Users, gate: "circles" },
  { to: "/identity", label: "Identity", icon: User },
];

// Tighter mobile bottom nav (5 items)
const mobileNav: readonly NavItem[] = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { to: "/recovery", label: "Recovery", icon: LifeBuoy },
  { to: "/insights", label: "Insights", icon: BarChart3, gate: "patterns" },
  { to: "/identity", label: "You", icon: User },
];

function filterByVisibility(items: readonly NavItem[], visible: RouteKey[]): NavItem[] {
  return items.filter((i) => !i.gate || visible.includes(i.gate));
}

type NavSignals = ReturnType<typeof useNavSignals>;

function applyNavOrder(items: NavItem[], signals: NavSignals): NavItem[] {
  const { hasCheckedInToday, phase, recoveryMode } = signals;
  const reordered = [...items];

  const recoveryIdx = reordered.findIndex((i) => i.to === "/recovery");
  if (recoveryMode && recoveryIdx > 1) {
    const [item] = reordered.splice(recoveryIdx, 1);
    reordered.splice(1, 0, item);
  }

  const checkInIdx = reordered.findIndex((i) => i.to === "/check-in");
  if (!hasCheckedInToday && (phase === "midday" || phase === "evening") && checkInIdx > 1) {
    const [item] = reordered.splice(checkInIdx, 1);
    reordered.splice(recoveryMode ? 2 : 1, 0, item);
  }

  return reordered;
}

type BadgeType = "pulse-dot" | "dot" | "glow-ring" | null;
type BadgeColor = "accent" | "warning" | "danger" | "success" | "neutral";
type BadgeSpec = { type: BadgeType; color: BadgeColor };

function getNavBadge(to: string, signals: NavSignals, active: boolean): BadgeSpec {
  const none: BadgeSpec = { type: null, color: "accent" };
  if (active || signals.focusActive) return none;

  const {
    hasCheckedInToday, phase, recoveryMode, userState,
    streakAtRisk, pendingInsights, todayLoadRisk,
    rescheduleAlertCount, streakCurrentMilestoneNext, currentStreak,
  } = signals;

  if (to === "/check-in") {
    if (phase === "evening" && !hasCheckedInToday) return { type: "pulse-dot", color: "warning" };
    if (phase === "midday" && !hasCheckedInToday) return { type: "dot", color: "accent" };
  }
  if (to === "/recovery") {
    if (recoveryMode) return { type: "glow-ring", color: "warning" };
    if (userState === "burnout") return { type: "dot", color: "danger" };
  }
  if (to === "/insights" && pendingInsights > 0) return { type: "dot", color: "accent" };
  if (to === "/" && (streakAtRisk || todayLoadRisk === "overloaded")) return { type: "dot", color: "warning" };
  if (to === "/identity" && streakCurrentMilestoneNext === 1 && currentStreak > 0)
    return { type: "dot", color: "success" };
  if (to === "/weekly" && rescheduleAlertCount >= 2) return { type: "dot", color: "neutral" };

  return none;
}

const badgeDotColor: Record<BadgeColor, string> = {
  accent: "bg-accent",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
  neutral: "bg-muted-foreground",
};

function NavBadge({ spec }: { spec: BadgeSpec }) {
  if (!spec.type || spec.type === "glow-ring") return null;
  return (
    <span
      className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${badgeDotColor[spec.color]}${spec.type === "pulse-dot" ? " animate-pulse" : ""}`}
    />
  );
}

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  return to !== "/" && pathname.startsWith(to);
}

function BottomNav() {
  const loc = useLocation();
  const visible = useVisibleRoutes();
  const signals = useNavSignals();
  const focusActive = useApp((s) => s.focusEnvironment.active);
  const pipelineMode = useApp((s) => s.lastPipelineResult?.stateInterpretation.currentMode);
  const exitFocusEnvironment = useApp((s) => s.exitFocusEnvironment);
  const suppressionLevel = !focusActive ? "none" : pipelineMode === "RECOVERY" ? "full" : "partial";
  const orderedItems = applyNavOrder(filterByVisibility(mobileNav, visible), signals);
  // During focus: reduce to Today + Check-in only
  const items = focusActive
    ? orderedItems.filter((i) => i.to === "/" || i.to === "/check-in")
    : orderedItems;
  const hide = loc.pathname === "/onboarding" || loc.pathname === "/sign-in";
  if (hide) return null;
  if (suppressionLevel === "full") return null;
  return (
    <nav className="sticky bottom-0 z-30 mt-auto lg:hidden">
      {focusActive && (
        <button
          onClick={() => exitFocusEnvironment("interruption")}
          className="mx-auto mb-1 block text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          End session
        </button>
      )}
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
      <div className="glass mx-3 mb-3 rounded-3xl px-2 py-2 shadow-elegant overflow-hidden border border-border/60">
        {focusActive && (
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent/80 to-transparent" />
        )}
        <LayoutGroup id="mobile-nav">
          <ul className="relative flex items-center justify-between">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(loc.pathname, item.to, "exact" in item ? item.exact : false);
              const badge = getNavBadge(item.to, signals, active);
              const isRecoveryItem = item.to === "/recovery";
              const dimmed =
                (!focusActive && signals.recoveryMode && !isRecoveryItem) ||
                (focusActive && item.to !== "/" && item.to !== "/check-in");
              return (
                <motion.li layout key={item.to} className="relative flex-1">
                  <Link
                    to={item.to}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    } ${dimmed ? "opacity-45 pointer-events-none" : ""}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="mobile-nav-pill"
                        className="absolute inset-0 -z-10 rounded-2xl bg-secondary"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">
                      <Icon
                        className={`h-[18px] w-[18px] ${
                          active ? "text-accent" :
                          isRecoveryItem && signals.recoveryMode ? "text-warning" : ""
                        }`}
                        style={
                          isRecoveryItem && signals.recoveryMode
                            ? { filter: "drop-shadow(0 0 6px var(--warning))" }
                            : undefined
                        }
                        strokeWidth={1.75}
                      />
                      <NavBadge spec={badge} />
                    </span>
                    <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </nav>
  );
}

function Sidebar() {
  const loc = useLocation();
  const { state, label, tone } = useUserState();
  const visible = useVisibleRoutes();
  const signals = useNavSignals();
  const sidebarItems = applyNavOrder(filterByVisibility(primaryNav, visible), signals);
  const checkInCount = useApp((s) => s.checkIns.length);
  const dataIsSeeded = useApp((s) => s.dataIsSeeded);
  const focusActive = useApp((s) => s.focusEnvironment.active);
  const focusEnv = useFocusEnvironment();
  const pipelineMode = useApp((s) => s.lastPipelineResult?.stateInterpretation.currentMode);
  const exitFocusEnvironment = useApp((s) => s.exitFocusEnvironment);
  const suppressionLevel = !focusActive ? "none" : pipelineMode === "RECOVERY" ? "full" : "partial";
  const showStatePanel = dataIsSeeded || checkInCount >= 5;
  const toneClass: Record<string, string> = {
    success: "bg-success/15 text-success border-success/20",
    accent: "bg-accent/15 text-accent border-accent/20",
    warning: "bg-warning/15 text-warning border-warning/20",
    danger: "bg-danger/15 text-danger border-danger/20",
    neutral: "bg-secondary text-muted-foreground border-border",
  };
  if (suppressionLevel === "full") return null;
  return (
    <aside className="hidden lg:flex lg:w-[240px] lg:flex-col lg:border-r lg:border-border/60 lg:px-4 lg:py-7 lg:sticky lg:top-0 lg:h-screen">
      {/* Wordmark */}
      <Link to="/" className="mb-6 flex items-center gap-3 px-2">
        <div className="relative h-7 w-7 rounded-xl bg-gradient-accent shadow-glow flex-none" />
        <div>
          <p className="font-display text-[17px] leading-none text-foreground tracking-tight">North</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            Behavioral OS
          </p>
        </div>
      </Link>

      {/* State chip */}
      {showStatePanel && (
        <div className={`mb-4 rounded-2xl border px-3.5 py-2.5 ${toneClass[tone]}`}>
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1">Current state</p>
          <p className="text-[13px] font-semibold leading-tight">{label}</p>
          <p className="text-[10px] opacity-55 capitalize mt-0.5">{state}</p>
        </div>
      )}

      {/* Focus active strip */}
      {focusActive && (
        <div className="mb-3 overflow-hidden rounded-xl border border-accent/20 bg-accent/5">
          <div className="h-[2px] w-full bg-gradient-to-r from-accent via-accent/80 to-transparent animate-pulse" />
          {focusEnv.primaryTask && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground truncate">
              {focusEnv.primaryTask.title}
            </p>
          )}
        </div>
      )}

      {/* Nav items */}
      <LayoutGroup id="sidebar-nav">
        <nav className="flex flex-col gap-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(loc.pathname, item.to, "exact" in item ? item.exact : false);
            const badge = getNavBadge(item.to, signals, active);
            const isRecoveryItem = item.to === "/recovery";
            const dimmed =
              (!focusActive && signals.recoveryMode && !isRecoveryItem) ||
              (focusActive && item.to !== "/" && item.to !== "/check-in");
            const glowRing = badge.type === "glow-ring" ? "ring-1 ring-warning/40" : "";
            return (
              <motion.div layout key={item.to}>
                <Link
                  to={item.to}
                  className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] transition-colors ${
                    active
                      ? "text-foreground"
                      : dimmed
                        ? "text-muted-foreground/30 pointer-events-none"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-secondary"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={`relative flex-none rounded-lg ${glowRing}`}>
                    <Icon
                      className={`h-4 w-4 ${
                        active
                          ? "text-accent"
                          : isRecoveryItem && signals.recoveryMode
                            ? "text-warning"
                            : "opacity-55 group-hover:opacity-90"
                      }`}
                      strokeWidth={1.75}
                    />
                    <NavBadge spec={badge} />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </LayoutGroup>

      {/* Bottom shelf */}
      <div className="mt-auto flex flex-col gap-3">
        {focusActive && (
          <button
            onClick={() => exitFocusEnvironment("interruption")}
            className="px-2.5 text-left text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            End session
          </button>
        )}

        <div className="flex items-center justify-between px-2.5">
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/50">
            Appearance
          </span>
          <ThemeToggle />
        </div>

        <Link
          to="/premium"
          className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/8 to-transparent px-3.5 py-3 transition-all hover:border-accent/45 hover:from-accent/12"
        >
          <Crown className="h-3.5 w-3.5 text-accent flex-none" />
          <div>
            <p className="text-[12px] font-semibold text-foreground">North Pro</p>
            <p className="text-[10px] text-muted-foreground/70">Adaptive coaching</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const loc = useLocation();
  const isOnboarding = loc.pathname === "/onboarding";
  const isSignIn = loc.pathname === "/sign-in";
  const hideNav = isOnboarding || isSignIn;
  const { theme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const exitFocusEnvironment = useApp((s) => s.exitFocusEnvironment);
  const focusActive = useApp((s) => s.focusEnvironment.active);

  // Exit focus environment on navigation away from Today (§3.2)
  useEffect(() => {
    if (focusActive && loc.pathname !== "/") {
      exitFocusEnvironment("interruption");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    // Background snapshot recompute: runs at most once per mount, non-blocking
    const state = useApp.getState();
    const w7 = state.aggregationSnapshots.W7;
    const w14 = state.aggregationSnapshots.W14;
    if (state.history.length > 0 && (!w7 || isSnapshotStale(w7) || !w14 || isSnapshotStale(w14))) {
      const nextSnapshots = computeAllSnapshots(
        state.history,
        state.checkIns,
        state.blockerHistory,
        state.distractionLog,
      );
      state.refreshSnapshots(nextSnapshots);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Restore an existing Supabase session if the store thinks we're a guest
    supabase.auth.getSession().then(({ data: { session } }) => {
      const state = useApp.getState();
      if (session && state.sessionType === "guest") {
        // Returning authenticated user — hydrate from DB and transition to authenticated
        hydrateFromDB(session.user.id).then((cloudData) => {
          useApp
            .getState()
            .migrateGuestToAccount(session.user.id, session.user.email ?? "", cloudData);
        });
      } else if (!session && state.sessionType === "authenticated") {
        // Session expired — gracefully drop to guest mode (no redirect)
        useApp.getState().startGuestSession();
      }
      // No session + guest = normal guest mode, no action needed
    });

    // Listen for auth state changes from other tabs
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        useApp.getState().startGuestSession();
        // User stays on current page in guest mode — no redirect
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FocusOverlay />
      <EnvironmentRenderer />
      {import.meta.env.DEV && <AdaptationDebugOverlay />}
      <AuroraBackground />
      <CommandPalette />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Toaster
        theme={theme}
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            borderRadius: "14px",
            boxShadow: "var(--shadow-elegant)",
          },
        }}
      />
      {hideNav ? (
        <div className="min-h-screen bg-transparent">
          <Outlet />
        </div>
      ) : (
        <div className="min-h-screen bg-transparent lg:flex">
          <Sidebar />
          <main className="relative mx-auto flex min-h-screen w-full max-w-[460px] flex-col lg:max-w-none lg:flex-1 lg:px-10 lg:py-8 lg:overflow-x-hidden">
            {/* Desktop top-bar */}
            <div className="hidden lg:flex items-center justify-end gap-3 pb-4">
              <ThemeToggle />
              <HelpButton onClick={() => setHelpOpen(true)} />
              <CommandHint />
            </div>
            {/* Mobile theme toggle — floats top-right */}
            <div className="flex lg:hidden justify-end px-5 pt-4 pb-0">
              <ThemeToggle />
            </div>
            <div className="flex flex-1 flex-col lg:max-w-[680px] lg:mx-auto lg:w-full">
              <SaveProgressBanner />
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
            <MobileHelpButton onClick={() => setHelpOpen(true)} />
            <BottomNav />
          </main>
        </div>
      )}
    </QueryClientProvider>
  );
}
