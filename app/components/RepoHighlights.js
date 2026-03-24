"use client";

function formatRelativeDate(dateString) {
  if (!dateString) return "Unknown";

  const diff = Date.now() - new Date(dateString).getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / day);

  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function RepoHighlights({ repos }) {
  return (
    <div className="glass-card p-6 animate-fade-up" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Top Repository Highlights
        </h3>
        <span className="text-xs font-mono text-slate-500">
          Ranked by stars and forks
        </span>
      </div>

      {!repos.length ? (
        <div className="text-slate-500 font-mono text-sm">No repositories available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-dark-400 bg-dark-700/40 p-4 hover:border-cyan-400/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-mono text-sm text-white truncate">{repo.name}</h4>
                {repo.archived && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-300 font-mono">
                    archived
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-3 line-clamp-2 min-h-[32px]">
                {repo.description || "No description provided"}
              </p>

              <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-500">
                <span>⭐ {repo.stars}</span>
                <span>🍴 {repo.forks}</span>
                <span>{repo.language || "Unknown"}</span>
                <span>Updated {formatRelativeDate(repo.pushed_at)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
