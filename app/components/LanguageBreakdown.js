"use client";

export default function LanguageBreakdown({ languages, totalRepos }) {
  if (!languages || Object.keys(languages).length === 0) {
    return null;
  }

  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const total = Object.values(languages).reduce((sum, v) => sum + v, 0);

  return (
    <div className="glass-card p-6 animate-fade-up" style={{ opacity: 0 }}>
      <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-5">
        Language Breakdown by Repository Count
      </h3>

      <div className="space-y-4">
        {entries.map(([lang, count]) => {
          const percentage = Math.round((count / total) * 100);
          return (
            <div key={lang}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-slate-300">{lang}</span>
                <span className="font-mono text-xs text-slate-500">
                  {count} repo{count !== 1 ? "s" : ""} ({percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-dark-600 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-dark-600 text-xs font-mono text-slate-500">
        <p>Total repositories with detected languages: {total}</p>
      </div>
    </div>
  );
}
