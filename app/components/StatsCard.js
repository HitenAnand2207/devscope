// ─────────────────────────────────────────────
//  components/StatsCard.js
//  A reusable card that displays a single stat
//  with an icon, label, and animated value.
// ─────────────────────────────────────────────

export default function StatsCard({ icon, label, value, subtitle, delay = 0 }) {
  return (
    <div
      className="glass-card p-5 flex flex-col gap-3 animate-fade-up hover:border-cyan-400/30 transition-all duration-300 group"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      {/* Icon + Label row */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>

      {/* Main value */}
      <div className="stat-value font-mono text-3xl font-bold leading-none">
        {value?.toLocaleString() ?? "—"}
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <div className="text-xs text-slate-500">{subtitle}</div>
      )}
    </div>
  );
}