import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Home, ClipboardCheck, LifeBuoy, BarChart3, User } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">This screen doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background">
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
          onClick={() => { router.invalidate(); reset(); }}
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
      { name: "description", content: "Recover from inconsistency, prevent motivation crashes, and build reliable execution. A psychologically aware productivity system." },
      { name: "theme-color", content: "#0a0a0c" },
      { property: "og:title", content: "Cadence — Behavioral OS" },
      { property: "og:description", content: "A behavioral operating system for ambitious people." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" },
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
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const navItems = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { to: "/recovery", label: "Recovery", icon: LifeBuoy },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/identity", label: "Identity", icon: User },
] as const;

function BottomNav() {
  const loc = useLocation();
  const hide = loc.pathname === "/onboarding";
  if (hide) return null;
  return (
    <nav className="sticky bottom-0 z-30 mt-auto">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
      <div className="glass mx-3 mb-3 rounded-3xl px-2 py-2 shadow-elegant">
        <ul className="flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = "exact" in item && item.exact ? loc.pathname === item.to : item.to !== "/" && loc.pathname.startsWith(item.to);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "text-accent" : ""}`} strokeWidth={1.75} />
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background lg:my-6 lg:min-h-[calc(100vh-3rem)] lg:max-w-[420px] lg:rounded-[44px] lg:border lg:border-border lg:shadow-elegant lg:overflow-hidden">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen lg:flex lg:items-start lg:justify-center lg:bg-black lg:py-6">
        <PhoneFrame>
          <Outlet />
        </PhoneFrame>
      </div>
    </QueryClientProvider>
  );
}
