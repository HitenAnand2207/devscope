"use client";

import { useMemo, useState } from "react";

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
  const [sortMode, setSortMode] = useState("impact");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [languageFilter, setLanguageFilter] = useState("all");

  const hasActiveFilters =
    sortMode !== "impact" || query.trim() !== "" || languageFilter !== "all" || expanded;

  function resetFilters() {
    setSortMode("impact");
    setQuery("");
    setExpanded(false);
    setLanguageFilter("all");
  }

  const availableLanguages = useMemo(() => {
    const unique = new Set();
    repos.forEach((repo) => {
      if (repo.language) {
        unique.add(repo.language);
      }
    });

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [repos]);

  const sortedRepos = useMemo(() => {
    const list = [...repos];

    if (sortMode === "recent") {
      list.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
      return list;
    }

    if (sortMode === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
      return list;
    }

    list.sort((a, b) => {
      const aScore = (a.stars || 0) * 2 + (a.forks || 0);
      const bScore = (b.stars || 0) * 2 + (b.forks || 0);
      return bScore - aScore;
    });

    return list;
  }, [repos, sortMode]);

  const visibleRepos = useMemo(() => {
    const search = query.trim().toLowerCase();

    return sortedRepos.filter((repo) => {
      const matchesSearch = !search || repo.name.toLowerCase().includes(search);
      const repoLanguage = repo.language || "Unknown";
      const matchesLanguage = languageFilter === "all" || repoLanguage === languageFilter;
      return matchesSearch && matchesLanguage;
    });
  }, [sortedRepos, query, languageFilter]);

  const shownRepos = useMemo(() => {
    if (expanded) return visibleRepos.slice(0, 12);
    return visibleRepos.slice(0, 6);
  }, [visibleRepos, expanded]);

  return (
    <div className="glass-card p-6 animate-fade-up" style={{ opacity: 0 }}>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Top Repository Highlights
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter repos"
            className="px-2.5 py-1 rounded-md bg-dark-700 border border-dark-400 text-[11px] font-mono text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/40"
          />
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-dark-700 border border-dark-400 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="all">All Languages</option>
            <option value="Unknown">Unknown</option>
            {availableLanguages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <span className="text-xs font-mono text-slate-500">Sort</span>
          {[
            { id: "impact", label: "Impact" },
            { id: "recent", label: "Recent" },
            { id: "name", label: "Name" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSortMode(mode.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                sortMode === mode.id
                  ? "border-cyan-400/60 text-cyan-300 bg-cyan-400/10"
                  : "border-dark-400 text-slate-500 hover:text-slate-300"
              }`}
            >
              {mode.label}
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-dark-400 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {!repos.length ? (
        <div className="text-slate-500 font-mono text-sm">No repositories available</div>
      ) : !visibleRepos.length ? (
        <div className="text-slate-500 font-mono text-sm">No repositories match your filter</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shownRepos.map((repo) => (
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

          {visibleRepos.length > 6 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Showing {shownRepos.length} of {visibleRepos.length}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-dark-400 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
              >
                {expanded ? "Show Less" : "Show More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
