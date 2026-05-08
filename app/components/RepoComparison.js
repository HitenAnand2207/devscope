"use client";

import { useMemo } from "react";

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

function getRepoScale(score) {
  if (score >= 100) return "Dominant";
  if (score >= 40) return "Strong";
  if (score >= 15) return "Solid";
  return "Emerging";
}

function ComparisonBar({ value, maxValue, label, color = "cyan" }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const colorClasses = {
    cyan: "bg-cyan-400/40",
    green: "bg-green-400/40",
    amber: "bg-amber-400/40",
    pink: "bg-pink-400/40",
  };

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-slate-400">{label}</span>
        <span className="text-xs font-mono text-slate-300">{formatCount(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-dark-700 overflow-hidden border border-dark-400">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function RepoComparison({ selectedRepos, onClose }) {
  if (!selectedRepos || selectedRepos.length < 2) return null;

  const comparisonData = useMemo(() => {
    const metrics = {
      stars: selectedRepos.map((r) => r.stars || 0),
      forks: selectedRepos.map((r) => r.forks || 0),
      watchers: selectedRepos.map((r) => r.watchers || 0),
      issues: selectedRepos.map((r) => r.open_issues_count || 0),
    };

    const maxValues = {
      stars: Math.max(...metrics.stars),
      forks: Math.max(...metrics.forks),
      watchers: Math.max(...metrics.watchers),
      issues: Math.max(...metrics.issues),
    };

    return { metrics, maxValues };
  }, [selectedRepos]);

  const winner = useMemo(() => {
    const scores = selectedRepos.map((repo) => {
      const score = (repo.stars || 0) * 2 + (repo.forks || 0);
      return score;
    });
    return scores.indexOf(Math.max(...scores));
  }, [selectedRepos]);

  const repoColors = ["cyan", "green", "amber", "pink"];

  return (
    <div className="glass-card p-6 animate-fade-up border-gradient mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Repository Comparison
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Side-by-side analysis of {selectedRepos.length} selected repositories
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-md text-xs font-mono border border-dark-400 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
        >
          Close
        </button>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${selectedRepos.length}, 1fr)` }}>
        {selectedRepos.map((repo, idx) => {
          const score = (repo.stars || 0) * 2 + (repo.forks || 0);
          const scale = getRepoScale(score);
          const isWinner = idx === winner;

          return (
            <div
              key={repo.id}
              className={`rounded-xl border p-4 transition-all ${
                isWinner
                  ? "border-cyan-400/60 bg-cyan-400/10"
                  : "border-dark-400 bg-dark-700/40"
              }`}
            >
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-cyan-300 hover:text-cyan-200 truncate flex-1"
                    title={repo.name}
                  >
                    {repo.name}
                  </a>
                  {isWinner && (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-cyan-400/60 bg-cyan-400/10 text-cyan-300 font-mono">
                      Leader
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                  {repo.description || "No description"}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 font-mono">
                    {repo.language || "Unknown"}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full border border-slate-500/40 bg-slate-500/10 text-slate-300 font-mono">
                    {scale}
                  </span>
                  {repo.fork && (
                    <span className="text-xs px-2 py-1 rounded-full border border-slate-500/40 text-slate-300 font-mono">
                      fork
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <ComparisonBar
                  value={repo.stars || 0}
                  maxValue={comparisonData.maxValues.stars}
                  label="Stars"
                  color={repoColors[idx]}
                />
                <ComparisonBar
                  value={repo.forks || 0}
                  maxValue={comparisonData.maxValues.forks}
                  label="Forks"
                  color={repoColors[idx]}
                />
                <ComparisonBar
                  value={repo.watchers || 0}
                  maxValue={comparisonData.maxValues.watchers}
                  label="Watchers"
                  color={repoColors[idx]}
                />
                <ComparisonBar
                  value={repo.open_issues_count || 0}
                  maxValue={comparisonData.maxValues.issues}
                  label="Open Issues"
                  color={repoColors[idx]}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-dark-400">
                <p className="text-xs font-mono text-slate-500 mb-2">Impact Score</p>
                <p className="text-lg font-mono text-slate-200">
                  {formatCount((repo.stars || 0) * 2 + (repo.forks || 0))}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatCount(repo.watchers || 0)} watchers • {formatCount(repo.open_issues_count || 0)} issues
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dark-400 bg-dark-700/30 p-4">
        <h4 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-3">
          Comparison Insights
        </h4>
        <div className="space-y-2 text-sm text-slate-400 font-mono">
          <div>
            <span className="text-slate-500">Most Popular:</span>{" "}
            <span className="text-cyan-300">{selectedRepos[winner].name}</span> with{" "}
            <span className="text-cyan-300">{formatCount(selectedRepos[winner].stars)}</span> stars
          </div>
          <div>
            <span className="text-slate-500">Highest Activity:</span>{" "}
            <span className="text-cyan-300">
              {selectedRepos.reduce((max, r) => ((r.watchers || 0) > (max.watchers || 0) ? r : max)).name}
            </span>{" "}
            with{" "}
            <span className="text-cyan-300">
              {formatCount(selectedRepos.reduce((max, r) => Math.max(max, r.watchers || 0), 0))} watchers
            </span>
          </div>
          <div>
            <span className="text-slate-500">Languages:</span>{" "}
            <span className="text-cyan-300">{selectedRepos.map((r) => r.language || "Unknown").join(", ")}</span>
          </div>
          <div>
            <span className="text-slate-500">Combined Impact:</span>{" "}
            <span className="text-cyan-300">
              {formatCount(
                selectedRepos.reduce((sum, r) => sum + ((r.stars || 0) * 2 + (r.forks || 0)), 0)
              )}{" "}
              points
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
