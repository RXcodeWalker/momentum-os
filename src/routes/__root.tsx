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
import {
  Home,
  ClipboardCheck,
  LifeBuoy,
  BarChart3,
  User,
  LayoutDashboard,
  Users,
  Crown,
  Calendar,
} from "lucide-react";
import { useApp, useUserState } from "@/lib/store";
import { useFocusEnvironment } from "@/hooks/internal/useFocusEnvironment";
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

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  return to !== "/" && pathname.startsWith(to);
}

function BottomNav() {
  const loc = useLocation();
  const visible = useVisibleRoutes();
  const focusActive = useApp((s) => s.focusEnvironment.active);
  const allItems = filterByVisibility(mobileNav, visible);
  // During focus: reduce to Today + Check-in only
  const items = focusActive
    ? allItems.filter((i) => i.to === "/" || i.to === "/check-in")
    : allItems;
  const hide = loc.pathname === "/onboarding" || loc.pathname === "/sign-in";
  if (hide) return null;
  return (
    <nav className="sticky bottom-0 z-30 mt-auto lg:hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
      <div className="glass mx-3 mb-3 rounded-3xl px-2 py-2 shadow-elegant">
        <LayoutGroup id="mobile-nav">
          <ul className="relative flex items-center justify-between">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(loc.pathname, item.to, "exact" in item ? item.exact : false);
              return (
                <li key={item.to} className="relative flex-1">
                  <Link
                    to={item.to}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="mobile-nav-pill"
                        className="absolute inset-0 -z-10 rounded-2xl bg-secondary"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon
                      className={`h-[18px] w-[18px] ${active ? "text-accent" : ""}`}
                      strokeWidth={1.75}
                    />
                    <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                  </Link>
                </li>
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
  const sidebarItems = filterByVisibility(primaryNav, visible);
  const checkInCount = useApp((s) => s.checkIns.length);
  const dataIsSeeded = useApp((s) => s.dataIsSeeded);
  const focusActive = useApp((s) => s.focusEnvironment.active);
  const showStatePanel = dataIsSeeded || checkInCount >= 5;
  const toneClass: Record<string, string> = {
    success: "bg-success/15 text-success border-success/20",
    accent: "bg-accent/15 text-accent border-accent/20",
    warning: "bg-warning/15 text-warning border-warning/20",
    danger: "bg-danger/15 text-danger border-danger/20",
    neutral: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:gap-1 lg:border-r lg:border-border lg:px-5 lg:py-7 lg:sticky lg:top-0 lg:h-screen font-['Bebas_Neue',_sans-serif]">
      <Link to="/" className="mb-4 flex items-center gap-2.5 px-2">
        <div className="relative h-8 w-8 rounded-xl bg-gradient-accent shadow-glow" />
        <div>
          <p className="font-display text-xl leading-none text-foreground">Cadence</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Behavioral OS
          </p>
        </div>
      </Link>

      {showStatePanel && (
        <div className={`mb-2 rounded-2xl border px-3 py-2 text-[11px] ${toneClass[tone]}`}>
          <p className="text-[9px] uppercase tracking-[0.18em] opacity-70">Current state</p>
          <p className="mt-1 text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-[10px] opacity-70 capitalize">{state}</p>
        </div>
      )}

      <LayoutGroup id="sidebar-nav">
        <nav className="flex flex-col gap-0">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(loc.pathname, item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "text-foreground"
                    : focusActive && item.to !== "/" && item.to !== "/check-in"
                      ? "text-muted-foreground/40 pointer-events-none"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-nav-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-secondary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  className={`h-[17px] w-[17px] ${active ? "text-accent" : "opacity-70 group-hover:opacity-100"}`}
                  strokeWidth={1.75}
                />
                <span className="font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Appearance
          </span>
          <ThemeToggle />
        </div>
        <Link
          to="/premium"
          className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent px-3 py-3 transition-all hover:border-accent/50"
        >
          <Crown className="h-4 w-4 text-accent" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-foreground">Cadence Pro</p>
            <p className="text-[10px] text-muted-foreground">Adaptive coaching</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function AdaptiveStateBinding() {
  const { state } = useUserState();
  const focusActive = useApp((s) => s.focusEnvironment.active);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = state;
    // Focus environment: suppress entrance animations via CSS data attribute
    if (focusActive) {
      root.dataset.focusEnv = "active";
    } else {
      delete root.dataset.focusEnv;
    }
  }, [state, focusActive]);
  return null;
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
      <AdaptiveStateBinding />
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
            <div className="flex flex-1 flex-col lg:max-w-[1280px] lg:mx-auto lg:w-full">
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
