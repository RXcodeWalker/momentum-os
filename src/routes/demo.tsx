import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Sample data — Cadence" },
      {
        name: "description",
        content: "A read-only demo loaded with example history so you can see how Cadence feels.",
      },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  const navigate = useNavigate();
  const loadDemoData = useApp((s) => s.loadDemoData);
  const dataIsSeeded = useApp((s) => s.dataIsSeeded);

  useEffect(() => {
    if (!dataIsSeeded) loadDemoData();
  }, [dataIsSeeded, loadDemoData]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="rounded-3xl border border-warning/40 bg-warning/10 px-5 py-4 mx-5 lg:mx-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-warning font-bold mb-1">
          Sample data
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          You're looking at example history. Your real Cadence starts when you{" "}
          <button
            className="underline hover:text-accent"
            onClick={() => {
              localStorage.removeItem("cadence-store-v1");
              window.location.assign("/");
            }}
          >
            clear the sample and start fresh
          </button>
          .
        </p>
      </div>

      <section className="px-5 lg:px-0 space-y-3">
        <h1 className="text-2xl font-display tracking-tight">What this view shows</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
          Sample data populates the heatmap, momentum trend, insights, and circles feed so the
          surface is fully rendered. None of it is yours. Visit{" "}
          <Link to="/" className="underline hover:text-accent">
            Today
          </Link>{" "}
          and other routes to see how the product feels at established-user maturity.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
          When you're ready, clear the sample to land on the honest empty state — Cadence will begin
          learning from your real check-ins from there.
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            to="/"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
          >
            Open Today
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("cadence-store-v1");
              window.location.assign("/");
              void navigate;
            }}
            className="hairline rounded-full px-5 py-2 text-sm font-medium hover:text-accent"
          >
            Clear sample & start real
          </button>
        </div>
      </section>
    </div>
  );
}
