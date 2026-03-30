// ─────────────────────────────────────────────
//  components/StatsCard.js
//  A reusable card that displays a single stat
//  with an icon, label, and animated value.
// ─────────────────────────────────────────────

export default function StatsCard({
  icon,
  label,
  value,
  subtitle,
  trend = "neutral",
  trendLabel,
  delay = 0,
}) {
  const trendClass = {
    up: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
    neutral: "border-slate-500/40 text-slate-300 bg-slate-500/10",
    down: "border-amber-400/40 text-amber-300 bg-amber-400/10",
  }[trend] || "border-slate-500/40 text-slate-300 bg-slate-500/10";

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

      {trendLabel && (
        <div className="pt-1">
          <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-mono uppercase tracking-wide ${trendClass}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}