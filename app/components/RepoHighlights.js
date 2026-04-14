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
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [minStars, setMinStars] = useState("0");
  const [recencyFilter, setRecencyFilter] = useState("all");
  const [includeForks, setIncludeForks] = useState(true);

  const hasActiveFilters =
    sortMode !== "impact" ||
    query.trim() !== "" ||
    languageFilter !== "all" ||
    statusFilter !== "all" ||
    minStars !== "0" ||
    recencyFilter !== "all" ||
    !includeForks ||
    viewMode !== "grid" ||
    expanded;

  function resetFilters() {
    setSortMode("impact");
    setQuery("");
    setExpanded(false);
    setLanguageFilter("all");
    setStatusFilter("all");
    setViewMode("grid");
    setMinStars("0");
    setRecencyFilter("all");
    setIncludeForks(true);
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
    const starThreshold = Number(minStars) || 0;
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const recencyDays = recencyFilter === "30" ? 30 : recencyFilter === "90" ? 90 : 0;

    return sortedRepos.filter((repo) => {
      const matchesSearch = !search || repo.name.toLowerCase().includes(search);
      const repoLanguage = repo.language || "Unknown";
      const matchesLanguage = languageFilter === "all" || repoLanguage === languageFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !repo.archived) ||
        (statusFilter === "archived" && repo.archived);
      const matchesStars = (repo.stars || 0) >= starThreshold;
      const matchesForks = includeForks || !repo.fork;
      const pushedAt = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0;
      const matchesRecency =
        recencyDays === 0 || (pushedAt > 0 && now - pushedAt <= recencyDays * DAY);

      return (
        matchesSearch &&
        matchesLanguage &&
        matchesStatus &&
        matchesStars &&
        matchesForks &&
        matchesRecency
      );
    });
  }, [sortedRepos, query, languageFilter, statusFilter, minStars, includeForks, recencyFilter]);

  const visibleSummary = useMemo(() => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    return visibleRepos.reduce(
      (acc, repo) => {
        acc.stars += repo.stars || 0;
        acc.forks += repo.forks || 0;
        if (repo.archived) {
          acc.archived += 1;
        }

        if (repo.pushed_at) {
          const pushedMs = new Date(repo.pushed_at).getTime();
          if (now - pushedMs <= 90 * DAY) {
            acc.updated90d += 1;
          }
        }

        return acc;
      },
      { stars: 0, forks: 0, archived: 0, updated90d: 0 }
    );
  }, [visibleRepos]);

  const shownRepos = useMemo(() => {
    if (expanded) return visibleRepos.slice(0, 24);
    return visibleRepos.slice(0, 6);
  }, [visibleRepos, expanded]);

  function exportShownAsCsv() {
    if (!shownRepos.length) return;

    const rows = [
      ["name", "language", "stars", "forks", "watchers", "issues", "archived", "fork", "updated", "url"],
      ...shownRepos.map((repo) => [
        repo.name,
        repo.language || "Unknown",
        repo.stars || 0,
        repo.forks || 0,
        repo.watchers || 0,
        repo.open_issues_count || 0,
        repo.archived ? "yes" : "no",
        repo.fork ? "yes" : "no",
        repo.pushed_at || "",
        repo.html_url,
      ]),
    ];

    const csv = rows
      .map((cols) =>
        cols
          .map((value) => {
            const text = String(value ?? "");
            const escaped = text.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "devscope-repo-highlights.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="glass-card p-4 sm:p-6 animate-fade-up" style={{ opacity: 0 }}>
      <div className="flex flex-col gap-3 mb-5">
        <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 truncate">
          Top Repository Highlights
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter repos"
            className="w-full min-w-0 px-2.5 py-1.5 rounded-md bg-dark-700 border border-dark-400 text-[11px] font-mono text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/40"
          />
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-full min-w-0 px-2.5 py-1.5 rounded-md bg-dark-700 border border-dark-400 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="all">All Languages</option>
            <option value="Unknown">Unknown</option>
            {availableLanguages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>

          <select
            value={minStars}
            onChange={(e) => setMinStars(e.target.value)}
            className="w-full min-w-0 px-2.5 py-1.5 rounded-md bg-dark-700 border border-dark-400 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="0">Any Stars</option>
            <option value="1">1+ Stars</option>
            <option value="5">5+ Stars</option>
            <option value="10">10+ Stars</option>
            <option value="25">25+ Stars</option>
            <option value="50">50+ Stars</option>
            <option value="100">100+ Stars</option>
          </select>

          <select
            value={recencyFilter}
            onChange={(e) => setRecencyFilter(e.target.value)}
            className="w-full min-w-0 px-2.5 py-1.5 rounded-md bg-dark-700 border border-dark-400 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="all">Any Update Time</option>
            <option value="30">Updated in 30d</option>
            <option value="90">Updated in 90d</option>
          </select>

          <div className="min-w-0 flex items-center gap-1 rounded-md border border-dark-400 bg-dark-700 p-0.5 overflow-x-auto">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "archived", label: "Archived" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setStatusFilter(mode.id)}
                className={`shrink-0 px-2 py-1 rounded-sm text-[11px] font-mono transition-colors ${
                  statusFilter === mode.id
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="min-w-0 flex items-center gap-1 rounded-md border border-dark-400 bg-dark-700 p-0.5 overflow-x-auto">
            {[
              { id: "grid", label: "Grid" },
              { id: "list", label: "List" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`shrink-0 px-2 py-1 rounded-sm text-[11px] font-mono transition-colors ${
                  viewMode === mode.id
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => setIncludeForks((v) => !v)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
              includeForks
                ? "border-dark-400 text-slate-500 hover:text-slate-300"
                : "border-cyan-400/60 text-cyan-300 bg-cyan-400/10"
            }`}
          >
            {includeForks ? "Including Forks" : "Forks Hidden"}
          </button>
          <button
            type="button"
            onClick={exportShownAsCsv}
            disabled={!shownRepos.length}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-dark-400 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export Shown CSV
          </button>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="sm:ml-auto px-2.5 py-1 rounded-md text-[11px] font-mono border border-dark-400 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
            <span>
              Showing {shownRepos.length} of {visibleRepos.length} matching repos
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {minStars !== "0" && (
                <span className="px-2 py-1 rounded-full border border-cyan-400/20 text-cyan-300">
                  {minStars}+ stars
                </span>
              )}
              {recencyFilter !== "all" && (
                <span className="px-2 py-1 rounded-full border border-cyan-400/20 text-cyan-300">
                  updated {recencyFilter}d
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            <div className="rounded-lg border border-dark-400 bg-dark-700/40 px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Visible Stars</p>
              <p className="text-sm font-mono text-slate-200">{visibleSummary.stars.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-dark-400 bg-dark-700/40 px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Visible Forks</p>
              <p className="text-sm font-mono text-slate-200">{visibleSummary.forks.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-dark-400 bg-dark-700/40 px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Updated 90d</p>
              <p className="text-sm font-mono text-slate-200">{visibleSummary.updated90d}</p>
            </div>
            <div className="rounded-lg border border-dark-400 bg-dark-700/40 px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Archived</p>
              <p className="text-sm font-mono text-slate-200">{visibleSummary.archived}</p>
            </div>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
            {shownRepos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-xl border border-dark-400 bg-dark-700/40 p-4 hover:border-cyan-400/40 transition-colors min-w-0 ${
                  viewMode === "list" ? "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
                    <h4 className="font-mono text-sm text-white truncate" title={repo.name}>
                      {repo.name}
                    </h4>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {repo.fork && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-500/40 text-slate-300 font-mono">
                          fork
                        </span>
                      )}
                      {repo.archived && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-300 font-mono">
                          archived
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 line-clamp-2 min-h-[32px] break-words">
                    {repo.description || "No description provided"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-500 shrink-0">
                  <span>⭐ {repo.stars}</span>
                  <span>🍴 {repo.forks}</span>
                  <span>👀 {repo.watchers || 0}</span>
                  <span>⚠ {repo.open_issues_count || 0}</span>
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
