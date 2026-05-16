"use client";
// Soft drifting gradient blobs + grain overlay. Pure presentational atmosphere.
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      <div className="grain-overlay" />
    </div>
  );
}
