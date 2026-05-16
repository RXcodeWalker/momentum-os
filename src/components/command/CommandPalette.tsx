"use client";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  ClipboardCheck,
  LifeBuoy,
  BarChart3,
  Calendar,
  LayoutDashboard,
  Users,
  User,
  Crown,
  Sparkles,
} from "lucide-react";

const items = [
  { to: "/", label: "Today", icon: Home, group: "Navigate" },
  { to: "/dashboard", label: "Command center", icon: LayoutDashboard, group: "Navigate" },
  { to: "/check-in", label: "Evening check-in", icon: ClipboardCheck, group: "Navigate" },
  { to: "/insights", label: "Insights", icon: BarChart3, group: "Navigate" },
  { to: "/weekly", label: "Weekly debrief", icon: Calendar, group: "Navigate" },
  { to: "/recovery", label: "Recovery protocol", icon: LifeBuoy, group: "Navigate" },
  { to: "/circles", label: "Trusted circles", icon: Users, group: "Navigate" },
  { to: "/identity", label: "Identity & progression", icon: User, group: "Navigate" },
  { to: "/premium", label: "Cadence Pro", icon: Crown, group: "Account" },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-background/70 backdrop-blur-md px-4 pt-[14vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-elegant"
          >
            <Command label="Command palette" className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Sparkles className="h-4 w-4 text-accent" />
                <Command.Input
                  autoFocus
                  placeholder="Jump to a page, action, or insight…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                />
                <kbd className="hidden md:inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No results.
                </Command.Empty>
                {(["Navigate", "Account"] as const).map((group) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {items
                      .filter((i) => i.group === group)
                      .map((i) => {
                        const Icon = i.icon;
                        return (
                          <Command.Item
                            key={i.to}
                            value={i.label}
                            onSelect={() => {
                              setOpen(false);
                              navigate({ to: i.to });
                            }}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
                          >
                            <Icon className="h-4 w-4 opacity-80" strokeWidth={1.75} />
                            <span className="flex-1">{i.label}</span>
                          </Command.Item>
                        );
                      })}
                  </Command.Group>
                ))}
              </Command.List>
              <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
                <span>Cadence</span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-secondary px-1">↵</kbd> open
                </span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CommandHint({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden lg:inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition"
    >
      <Sparkles className="h-3 w-3 text-accent" />
      Quick jump
      <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">⌘K</kbd>
    </button>
  );
}
