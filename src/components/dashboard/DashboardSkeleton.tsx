"use client";

/* ═══════════════════════════════════════════════
   DashboardSkeleton — three-layer loading mirror
   All styles in dashboard.css — no inline, no <style>.
   ═══════════════════════════════════════════════ */

function Bar({ w, h }: { w: string; h?: string }) {
  return (
    <div
      className={`dash-skel-bar ${h === "lg" ? "dash-skel-bar-lg" : h === "md" ? "dash-skel-bar-md" : "dash-skel-bar-sm"}`}
      style={{ width: w }}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="dash-skel">
      {/* ── Layer 1: Hero ── */}
      <div className="dash-skel-layer">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "rgba(144,200,255,0.15)", animation: "dashSkelPulse 2s ease-in-out infinite" }}
          />
          <Bar w="5rem" />
          <div className="ml-auto">
            <Bar w="3rem" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 py-3">
          <div
            className="dash-skel-bar dash-skel-bar-lg"
            style={{ width: "9rem", background: "rgba(144,200,255,0.08)" }}
          />
          <Bar w="6rem" />
        </div>

        <div className="dash-skel-progress">
          <div className="dash-skel-progress-fill" />
        </div>

        <div className="flex justify-between">
          <Bar w="7rem" />
          <Bar w="2.5rem" />
        </div>

        <div className="flex justify-between pt-3 dash-skel-divider">
          <Bar w="5rem" />
          <Bar w="4rem" />
        </div>
      </div>

      {/* ── Layer 2: Capability Matrix ── */}
      <div className="dash-skel-layer">
        <div className="flex justify-between items-center">
          <Bar w="6rem" />
          <Bar w="2.5rem" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dash-skel-card">
              <Bar w="1.25rem" h="md" />
              <Bar w="7rem" />
              <Bar w="100%" />
              <Bar w="75%" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Layer 3: Action Call ── */}
      <div className="dash-skel-layer items-center text-center">
        <Bar w="14rem" />
        <Bar w="10rem" />
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <Bar w="4rem" />
          <Bar w="8rem" />
          <Bar w="6rem" />
        </div>
        <div
          className="dash-skel-bar dash-skel-bar-lg mt-2"
          style={{ width: "10rem", background: "rgba(144,200,255,0.06)" }}
        />
      </div>
    </div>
  );
}
