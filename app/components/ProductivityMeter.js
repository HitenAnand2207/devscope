// ─────────────────────────────────────────────
//  components/ProductivityMeter.js
//  Circular progress ring showing the dev score.
// ─────────────────────────────────────────────

export default function ProductivityMeter({ score }) {
  // SVG circle math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Label based on score range
  const label =
    score >= 80 ? "Elite" :
    score >= 60 ? "Active" :
    score >= 40 ? "Growing" :
    "Explorer";

  const labelColor =
    score >= 80 ? "#00f5d4" :
    score >= 60 ? "#0af" :
    score >= 40 ? "#a855f7" :
    "#f59e0b";

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-4 animate-fade-up delay-300" style={{ opacity: 0 }}>
      <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
        Productivity Score
      </h3>

      {/* SVG ring */}
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="rgba(42,58,92,0.5)"
            strokeWidth="10"
          />
          {/* Foreground ring */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f5d4" />
              <stop offset="100%" stopColor="#0af" />
            </linearGradient>
          </defs>
        </svg>

        {/* Score text overlay */}
        <div className="absolute flex flex-col items-center">
          <span className="stat-value font-mono text-3xl font-bold">{score}</span>
          <span className="font-mono text-xs" style={{ color: labelColor }}>{label}</span>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Based on repos, stars & activity
      </p>
    </div>
  );
}