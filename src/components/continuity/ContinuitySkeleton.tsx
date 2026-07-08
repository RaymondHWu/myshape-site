export default function ContinuitySkeleton() {
  return (
    <div
      className="continuity-skeleton"
      aria-busy="true"
      aria-label="Loading network data"
    >
      {/* KPI skeleton */}
      <div className="continuity-skeleton-kpi">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="continuity-skeleton-card" />
        ))}
      </div>

      {/* Genesis section skeleton */}
      <div className="continuity-skeleton-genesis">
        <div className="continuity-skeleton-genesis-bar" />
      </div>

      {/* Node rows skeleton */}
      <div className="continuity-skeleton-rows">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="continuity-skeleton-row" />
        ))}
      </div>
    </div>
  );
}
