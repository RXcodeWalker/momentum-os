import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
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
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { hydrateFromDB } from "@/lib/sync";
import { AuroraBackground } from "@/components/atmosphere/AuroraBackground";
import { CommandPalette, CommandHint } from "@/components/command/CommandPalette";
import { SaveProgressBanner } from "@/components/SaveProgressBanner";
import { PageTransition } from "@/lib/motion";
import { Toaster } from "sonner";
import { motion, LayoutGroup } from "framer-motion";

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
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const primaryNav = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/weekly", label: "Weekly", icon: Calendar },
  { to: "/recovery", label: "Recovery", icon: LifeBuoy },
  { to: "/circles", label: "Circles", icon: Users },
  { to: "/identity", label: "Identity", icon: User },
] as const;

// Tighter mobile bottom nav (5 items)
const mobileNav = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { to: "/recovery", label: "Recovery", icon: LifeBuoy },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/identity", label: "You", icon: User },
] as const;

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  return to !== "/" && pathname.startsWith(to);
}

function BottomNav() {
  const loc = useLocation();
  const hide = loc.pathname === "/onboarding" || loc.pathname === "/sign-in";
  if (hide) return null;
  return (
    <nav className="sticky bottom-0 z-30 mt-auto lg:hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
      <div className="glass mx-3 mb-3 rounded-3xl px-2 py-2 shadow-elegant">
        <LayoutGroup id="mobile-nav">
          <ul className="relative flex items-center justify-between">
            {mobileNav.map((item) => {
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
  const toneClass: Record<string, string> = {
    success: "bg-success/15 text-success border-success/20",
    accent: "bg-accent/15 text-accent border-accent/20",
    warning: "bg-warning/15 text-warning border-warning/20",
    danger: "bg-danger/15 text-danger border-danger/20",
    neutral: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:gap-2 lg:border-r lg:border-border lg:px-5 lg:py-7 lg:sticky lg:top-0 lg:h-screen">
      <Link to="/" className="mb-6 flex items-center gap-2.5 px-2">
        <div className="relative h-8 w-8 rounded-xl bg-gradient-accent shadow-glow" />
        <div>
          <p className="font-display text-xl leading-none text-foreground">Cadence</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Behavioral OS
          </p>
        </div>
      </Link>

      <div className={`mb-4 rounded-2xl border px-3 py-2.5 text-[11px] ${toneClass[tone]}`}>
        <p className="text-[9px] uppercase tracking-[0.18em] opacity-70">Current state</p>
        <p className="mt-1 text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-[10px] opacity-70 capitalize">{state}</p>
      </div>

      <LayoutGroup id="sidebar-nav">
        <nav className="flex flex-col gap-0.5">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(loc.pathname, item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "text-foreground"
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

      <div className="mt-auto">
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
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = state;
  }, [state]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const loc = useLocation();
  const isOnboarding = loc.pathname === "/onboarding";
  const isSignIn = loc.pathname === "/sign-in";
  const hideNav = isOnboarding || isSignIn;

  useEffect(() => {
    // Restore an existing Supabase session if the store thinks we're a guest
    supabase.auth.getSession().then(({ data: { session } }) => {
      const state = useApp.getState();
      if (session && state.sessionType === "guest") {
        // Returning authenticated user — hydrate from DB and transition to authenticated
        hydrateFromDB(session.user.id).then((cloudData) => {
          useApp.getState().migrateGuestToAccount(
            session.user.id,
            session.user.email ?? "",
            cloudData,
          );
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
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            borderRadius: "14px",
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
            <div className="hidden lg:flex justify-end pb-4">
              <CommandHint />
            </div>
            <div className="flex flex-1 flex-col lg:max-w-[1280px] lg:mx-auto lg:w-full">
              <SaveProgressBanner />
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
            <BottomNav />
          </main>
        </div>
      )}
    </QueryClientProvider>
  );
}
