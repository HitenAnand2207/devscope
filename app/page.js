"use client";
import { useEffect, useRef, useState } from "react";
import StatsCard from "./components/StatsCard";
import LanguageChart from "./components/LanguageChart";
import LanguageBreakdown from "./components/LanguageBreakdown";
import CommitChart from "./components/CommitChart";
import ProductivityMeter from "./components/ProductivityMeter";
import LoadingSkeleton from "./components/LoadingSkeleton";
import RepoHighlights from "./components/RepoHighlights";
import ExportShare from "./components/ExportShare";

function isValidGithubUsername(input) {
  const value = input.trim();
  return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value);
}

const RECENT_USERS_KEY = "devscope.recentUsers";
const FAVORITE_USERS_KEY = "devscope.favoriteUsers";
const LAST_ANALYZED_USER_KEY = "devscope.lastAnalyzedUser";
const SAMPLE_USERS = [
  "torvalds",
  "gaearon",
  "yyx990803",
  "sindresorhus",
  "addyosmani",
  "tj",
  "kentcdodds",
  "vercel",
];

function getComparisonSummary(primaryData, secondaryData) {
  if (!primaryData || !secondaryData) return null;

  const primaryName = primaryData.profile?.login || "Primary";
  const secondaryName = secondaryData.profile?.login || "Secondary";

  const metricGroups = [
    {
      label: "Stars",
      primaryValue: primaryData.stats?.stars || 0,
      secondaryValue: secondaryData.stats?.stars || 0,
    },
    {
      label: "Repositories",
      primaryValue: primaryData.stats?.repos || 0,
      secondaryValue: secondaryData.stats?.repos || 0,
    },
    {
      label: "Followers",
      primaryValue: primaryData.profile?.followers || 0,
      secondaryValue: secondaryData.profile?.followers || 0,
    },
    {
      label: "90d Activity",
      primaryValue: primaryData.stats?.activeRepos90d || 0,
      secondaryValue: secondaryData.stats?.activeRepos90d || 0,
    },
    {
      label: "Productivity",
      primaryValue: primaryData.stats?.score || 0,
      secondaryValue: secondaryData.stats?.score || 0,
    },
  ];

  const metrics = metricGroups.map((metric) => {
    let winner = "tie";
    if (metric.primaryValue > metric.secondaryValue) {
      winner = "primary";
    } else if (metric.secondaryValue > metric.primaryValue) {
      winner = "secondary";
    }

    return {
      ...metric,
      winner,
    };
  });

  const primaryWins = metrics.filter((metric) => metric.winner === "primary").length;
  const secondaryWins = metrics.filter((metric) => metric.winner === "secondary").length;
  const ties = metrics.length - primaryWins - secondaryWins;

  let verdict = "Dead even";
  if (primaryWins > secondaryWins) {
    verdict = `${primaryName} leads ${primaryWins}-${secondaryWins}`;
  } else if (secondaryWins > primaryWins) {
    verdict = `${secondaryName} leads ${secondaryWins}-${primaryWins}`;
  }

  return {
    primaryName,
    secondaryName,
    primaryWins,
    secondaryWins,
    ties,
    verdict,
    metrics,
  };
}

function shortenHandle(value, maxLength = 12) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

export default function Home() {
  const inputRef = useRef(null);
  const compareInputRef = useRef(null);
  const [username, setUsername] = useState("");
  const [data, setData] = useState(null);
  const [analysisMeta, setAnalysisMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentUsers, setRecentUsers] = useState([]);
  const [favoriteUsers, setFavoriteUsers] = useState([]);
  const [lastAnalyzedUser, setLastAnalyzedUser] = useState("");
  const [copied, setCopied] = useState(false);
  const [insightCopied, setInsightCopied] = useState(false);
  const [compareUsername, setCompareUsername] = useState("");
  const [compareData, setCompareData] = useState(null);
  const [compareAnalysisMeta, setCompareAnalysisMeta] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareCopied, setCompareCopied] = useState(false);
  const [compareInsightCopied, setCompareInsightCopied] = useState(false);
  const [compareSummaryCopied, setCompareSummaryCopied] = useState(false);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(RECENT_USERS_KEY) || "[]");
      if (Array.isArray(cached)) {
        setRecentUsers(cached.slice(0, 6));
      }
    } catch {
      setRecentUsers([]);
    }

    try {
      const cachedFavorites = JSON.parse(localStorage.getItem(FAVORITE_USERS_KEY) || "[]");
      if (Array.isArray(cachedFavorites)) {
        setFavoriteUsers(cachedFavorites.slice(0, 8));
      }
    } catch {
      setFavoriteUsers([]);
    }

    try {
      const cachedLast = localStorage.getItem(LAST_ANALYZED_USER_KEY) || "";
      if (cachedLast) {
        setLastAnalyzedUser(cachedLast);
      }
    } catch {
      setLastAnalyzedUser("");
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("user");
    if (fromUrl && isValidGithubUsername(fromUrl)) {
      setUsername(fromUrl);
      analyzeUsername(fromUrl);
    }
  }, []);

  async function analyzeUsername(rawUsername) {
    const startedAt = performance.now();
    const cleanUsername = rawUsername.trim();

    if (!cleanUsername) {
      return;
    }

    if (!isValidGithubUsername(cleanUsername)) {
      setError("Please enter a valid GitHub username format.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);
    setAnalysisMeta(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong.");
      } else {
        const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
        setData(json);
        setAnalysisMeta({
          analyzedAt: new Date().toISOString(),
          durationMs,
        });
        setUsername(cleanUsername);

        const nextUsers = [
          cleanUsername,
          ...recentUsers.filter((u) => u.toLowerCase() !== cleanUsername.toLowerCase()),
        ].slice(0, 6);
        setRecentUsers(nextUsers);
        localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(nextUsers));
        setLastAnalyzedUser(cleanUsername);
        localStorage.setItem(LAST_ANALYZED_USER_KEY, cleanUsername);

        const url = new URL(window.location.href);
        url.searchParams.set("user", cleanUsername);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeRandomUser() {
    const candidates = SAMPLE_USERS.filter(
      (u) => u.toLowerCase() !== username.trim().toLowerCase()
    );
    const pool = candidates.length ? candidates : SAMPLE_USERS;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    setUsername(selected);
    await analyzeUsername(selected);
  }

  async function analyzeCompareUsername(rawUsername) {
    const startedAt = performance.now();
    const cleanUsername = rawUsername.trim();

    if (!cleanUsername) {
      return;
    }

    if (!isValidGithubUsername(cleanUsername)) {
      setError("Please enter a valid GitHub username format for comparison.");
      return;
    }

    setCompareLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong comparing profiles.");
      } else {
        const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
        setCompareData(json);
        setCompareAnalysisMeta({
          analyzedAt: new Date().toISOString(),
          durationMs,
        });
        setCompareUsername(cleanUsername);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setCompareLoading(false);
    }
  }

  function toggleFavoriteUser(rawUser) {
    const user = (rawUser || "").trim();
    if (!user) return;

    const exists = favoriteUsers.some((u) => u.toLowerCase() === user.toLowerCase());
    const next = exists
      ? favoriteUsers.filter((u) => u.toLowerCase() !== user.toLowerCase())
      : [user, ...favoriteUsers].slice(0, 8);

    setFavoriteUsers(next);
    localStorage.setItem(FAVORITE_USERS_KEY, JSON.stringify(next));
  }

  async function copyShareLink() {
    const user = data?.profile?.login || username.trim();
    if (!user) return;

    const url = `${window.location.origin}?user=${encodeURIComponent(user)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Could not copy link from this browser context.");
    }
  }

  function downloadAnalysisJson() {
    if (!data?.profile?.login) return;

    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        source: "DevScope",
        data,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${data.profile.login}-devscope-analysis.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export the analysis file.");
    }
  }

  function resetAnalysis() {
    setUsername("");
    setData(null);
    setAnalysisMeta(null);
    setError("");
    setCopied(false);
    setInsightCopied(false);
    setCompareUsername("");
    setCompareData(null);
    setCompareAnalysisMeta(null);
    setCompareCopied(false);
    setCompareInsightCopied(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("user");
    window.history.replaceState({}, "", url.toString());
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    await analyzeUsername(username);
  }

  async function copyInsightText() {
    const insight = data?.insight;
    if (!insight) return;

    try {
      await navigator.clipboard.writeText(insight);
      setInsightCopied(true);
      window.setTimeout(() => setInsightCopied(false), 1400);
    } catch {
      setError("Could not copy insight from this browser context.");
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && data) {
        resetAnalysis();
      }

      if (e.key === "/") {
        const target = e.target;
        const isTypingContext =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target?.isContentEditable;

        if (!isTypingContext) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data]);

  async function copyStats() {
    if (!data) return;

    try {
      const { profile, stats, topLanguages } = data;
      const langStr = Object.entries(topLanguages)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(", ");

      const summary = `DevScope Analysis for @${profile.login}
Generated: ${new Date().toLocaleString()}

PROFILE
Name: ${profile.name || profile.login}
Followers: ${profile.followers?.toLocaleString() || 0}
Following: ${profile.following?.toLocaleString() || 0}
Bio: ${profile.bio || "N/A"}

STATISTICS
Repositories: ${stats.repos}
Total Stars: ${stats.stars}
Average Stars/Repo: ${stats.avgStarsPerRepo}
Total Forks: ${stats.forks}
Productivity Score: ${stats.score}/100

ACTIVITY
Streak: ${stats.streak} weeks
Active Last 30d: ${stats.activeRepos30d} repos
Active Last 90d: ${stats.activeRepos90d} repos
Active Weeks (12-week window): ${stats.activeWeeks}/12
Archived Repos: ${stats.archivedRepos}

PROFILE HEALTH
Completeness: ${stats.profileCompleteness}%

TOP LANGUAGES
${langStr}

View full analysis: ${window.location.href}`;

      await navigator.clipboard.writeText(summary);
      setError("Stats copied to clipboard!");
      window.setTimeout(() => setError(""), 2000);
    } catch {
      setError("Could not copy stats from this browser context.");
    }
  }

  async function copyComparisonSummary() {
    if (!comparisonSummary) return;

    try {
      const lines = comparisonSummary.metrics.map((metric) => {
        const winner =
          metric.winner === "tie"
            ? "Tie"
            : metric.winner === "primary"
            ? comparisonSummary.primaryName
            : comparisonSummary.secondaryName;

        return `${metric.label}: ${comparisonSummary.primaryName} ${metric.primaryValue.toLocaleString()} vs ${comparisonSummary.secondaryName} ${metric.secondaryValue.toLocaleString()} (${winner})`;
      });

      const summary = `DevScope Comparison Summary
${comparisonSummary.primaryName} vs ${comparisonSummary.secondaryName}

Verdict: ${comparisonSummary.verdict}
Wins: ${comparisonSummary.primaryName} ${comparisonSummary.primaryWins} - ${comparisonSummary.secondaryName} ${comparisonSummary.secondaryWins}
Ties: ${comparisonSummary.ties}

${lines.join("\n")}`;

      await navigator.clipboard.writeText(summary);
      setCompareSummaryCopied(true);
      window.setTimeout(() => setCompareSummaryCopied(false), 1400);
    } catch {
      setError("Could not copy comparison summary from this browser context.");
    }
  }

  const comparisonSummary = getComparisonSummary(data, compareData);

  return (
    <main className="relative z-10 min-h-screen px-4 py-12 flex flex-col items-center">
      <header className="text-center mb-12 animate-fade-up" style={{ opacity: 0 }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase">
            GitHub Analyzer
          </span>
        </div>

        <h1 className="font-mono text-4xl md:text-5xl font-bold text-white text-glow-cyan mb-3">
          Dev<span className="text-cyan-400">Scope</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
          Deep-dive into any GitHub developer's activity, consistency, and engineering footprint.
        </p>
      </header>

      <form
        onSubmit={handleAnalyze}
        className="w-full max-w-xl flex gap-3 mb-12 animate-fade-up delay-200"
        style={{ opacity: 0 }}
      >
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm select-none">
            github.com/
          </span>
          <input
            ref={inputRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && username.trim()) {
                e.preventDefault();
                handleAnalyze(e);
              }
            }}
            placeholder="torvalds"
            autoComplete="off"
            spellCheck={false}
            className="
              w-full bg-dark-700 border border-dark-400 rounded-xl
              pl-[105px] pr-4 py-3.5
              font-mono text-white placeholder:text-slate-600
              focus:outline-none focus:border-cyan-400/60 focus:glow-cyan
              transition-all duration-200
            "
          />
        </div>

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="
            px-6 py-3.5 rounded-xl font-mono font-semibold text-sm
            bg-gradient-to-r from-cyan-400 to-blue-400
            text-dark-900 tracking-wide
            hover:opacity-90 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {loading ? "Analyzing…" : "Analyze →"}
        </button>

        <button
          type="button"
          onClick={analyzeRandomUser}
          disabled={loading}
          className="
            px-4 py-3.5 rounded-xl font-mono font-semibold text-xs
            border border-dark-400 text-slate-300 tracking-wide
            hover:border-cyan-400/40 hover:text-cyan-300
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          Surprise Me
        </button>
      </form>

      {data && !compareData && (
        <div className="w-full max-w-xl flex gap-3 mb-8 animate-fade-up delay-300" style={{ opacity: 0 }}>
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs select-none">
              vs
            </span>
            <input
              ref={compareInputRef}
              type="text"
              value={compareUsername}
              onChange={(e) => setCompareUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !compareLoading && compareUsername.trim()) {
                  e.preventDefault();
                  analyzeCompareUsername(compareUsername);
                }
              }}
              placeholder="gvanrossum"
              autoComplete="off"
              spellCheck={false}
              className="
                w-full bg-dark-700 border border-dark-400 rounded-xl
                pl-12 pr-4 py-3
                font-mono text-sm text-white placeholder:text-slate-600
                focus:outline-none focus:border-cyan-400/60 focus:glow-cyan
                transition-all duration-200
              "
            />
          </div>
          <button
            type="button"
            onClick={() => analyzeCompareUsername(compareUsername)}
            disabled={compareLoading || !compareUsername.trim()}
            className="
              px-4 py-3 rounded-xl font-mono font-semibold text-xs
              border border-cyan-400/40 text-cyan-300
              hover:bg-cyan-400/10 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {compareLoading ? "Comparing…" : "Compare"}
          </button>
        </div>
      )}

      {compareData && (
        <button
          type="button"
          onClick={() => {
            setCompareUsername("");
            setCompareData(null);
            setCompareAnalysisMeta(null);
            setCompareCopied(false);
            setCompareInsightCopied(false);
            setCompareSummaryCopied(false);
          }}
          className="w-full max-w-xl mb-2 px-3 py-2 text-xs font-mono text-slate-400 hover:text-slate-300 rounded-lg border border-dark-400 hover:border-red-500/40 transition-colors text-left"
        >
          ✕ Clear Comparison
        </button>
      )}

      {false && comparisonSummary && !compareLoading && (
        <div className="w-full max-w-7xl glass-card border-gradient p-5 mb-4 animate-fade-up" style={{ opacity: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-1">
                Comparison Summary
              </h3>
              <p className="text-sm text-slate-300 truncate" title={`${comparisonSummary.primaryName} vs ${comparisonSummary.secondaryName}`}>
                {shortenHandle(comparisonSummary.primaryName, 16)} vs {shortenHandle(comparisonSummary.secondaryName, 16)}
              </p>
            </div>
            <div
              className="max-w-full md:max-w-[320px] px-3 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 font-mono text-xs truncate"
              title={comparisonSummary.verdict}
            >
              {comparisonSummary.verdict}
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={copyComparisonSummary}
              className="px-3 py-1.5 rounded-md border border-dark-400 text-[11px] font-mono text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
            >
              {compareSummaryCopied ? "Summary Copied" : "Copy Summary"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {comparisonSummary.metrics.map((metric) => {
              const primaryLabel = metric.primaryValue.toLocaleString();
              const secondaryLabel = metric.secondaryValue.toLocaleString();

              return (
                <div key={metric.label} className="rounded-xl border border-dark-400 bg-dark-700/30 p-4 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                      {metric.label}
                    </span>
                    <span
                      className="max-w-[120px] text-[10px] font-mono px-2 py-0.5 rounded-full border border-dark-400 text-slate-400 truncate"
                      title={
                        metric.winner === "tie"
                          ? "Tie"
                          : metric.winner === "primary"
                          ? comparisonSummary.primaryName
                          : comparisonSummary.secondaryName
                      }
                    >
                      {metric.winner === "tie"
                        ? "Tie"
                        : metric.winner === "primary"
                        ? shortenHandle(comparisonSummary.primaryName, 14)
                        : shortenHandle(comparisonSummary.secondaryName, 14)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                    <div className="min-w-0">
                      <div className="text-slate-300 text-[11px] truncate" title={comparisonSummary.primaryName}>
                        {shortenHandle(comparisonSummary.primaryName, 14)}
                      </div>
                      <div className={metric.winner === "primary" ? "text-cyan-300" : "text-slate-500"}>
                        {primaryLabel}
                      </div>
                    </div>
                    <div className="text-right min-w-0">
                      <div className="text-slate-300 text-[11px] truncate" title={comparisonSummary.secondaryName}>
                        {shortenHandle(comparisonSummary.secondaryName, 14)}
                      </div>
                      <div className={metric.winner === "secondary" ? "text-cyan-300" : "text-slate-500"}>
                        {secondaryLabel}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs font-mono text-slate-500 break-words">
            Wins: {shortenHandle(comparisonSummary.primaryName, 16)} {comparisonSummary.primaryWins} - {shortenHandle(comparisonSummary.secondaryName, 16)} {comparisonSummary.secondaryWins} · {comparisonSummary.ties} ties
          </p>
        </div>
      )}

      {!loading && !data && lastAnalyzedUser && (
        <div className="w-full max-w-xl mb-8 animate-fade-up" style={{ opacity: 0 }}>
          <button
            type="button"
            onClick={() => {
              setUsername(lastAnalyzedUser);
              analyzeUsername(lastAnalyzedUser);
            }}
            className="px-3 py-2 rounded-lg border border-dark-400 text-xs font-mono text-slate-300 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
          >
            Resume Last: {lastAnalyzedUser}
          </button>
        </div>
      )}

      {!loading && recentUsers.length > 0 && (
        <div className="w-full max-w-xl mb-8 animate-fade-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
              Recent Searches
            </p>
            <button
              type="button"
              onClick={() => {
                setRecentUsers([]);
                localStorage.removeItem(RECENT_USERS_KEY);
              }}
              className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentUsers.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUsername(u);
                  analyzeUsername(u);
                }}
                className="px-3 py-1.5 rounded-full border border-dark-400 text-slate-400 font-mono text-xs hover:border-cyan-400/40 hover:text-cyan-400 transition-all"
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && favoriteUsers.length > 0 && (
        <div className="w-full max-w-xl mb-8 animate-fade-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
              Favorites
            </p>
            <button
              type="button"
              onClick={() => {
                setFavoriteUsers([]);
                localStorage.removeItem(FAVORITE_USERS_KEY);
              }}
              className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoriteUsers.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUsername(u);
                  analyzeUsername(u);
                }}
                className="px-3 py-1.5 rounded-full border border-cyan-400/30 text-cyan-300 font-mono text-xs hover:border-cyan-400/60 hover:text-cyan-200 transition-all"
              >
                ★ {u}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="w-full max-w-xl mb-8 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-sm animate-fade-up" style={{ opacity: 0 }}>
          ⚠ {error}
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {compareLoading && <LoadingSkeleton />}

      {data && !loading && compareData && !compareLoading && (
        <ProfileComparison
          primaryData={data}
          secondaryData={compareData}
          primaryMeta={analysisMeta}
          secondaryMeta={compareAnalysisMeta}
          summary={comparisonSummary}
          onCopySummary={copyComparisonSummary}
          summaryCopied={compareSummaryCopied}
        />
      )}

      {data && !loading && !compareData && (
        <Dashboard
          data={data}
          analysisMeta={analysisMeta}
          onToggleFavorite={toggleFavoriteUser}
          isFavorite={favoriteUsers.some(
            (u) => u.toLowerCase() === data?.profile?.login?.toLowerCase()
          )}
          onShare={copyShareLink}
          onExport={downloadAnalysisJson}
          onReset={resetAnalysis}
          onCopyInsight={copyInsightText}
          onCopyStats={copyStats}
          copied={copied}
          insightCopied={insightCopied}
          username={username}
          repos={data.repositories || data.topRepositories || []}
        />
      )}

      {!data && !loading && !error && (
        <div className="text-center mt-8 animate-fade-up delay-300" style={{ opacity: 0 }}>
          <div className="text-6xl mb-4">🔭</div>
          <p className="text-slate-600 font-mono text-sm">
            Enter a GitHub username above to get started
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SAMPLE_USERS.slice(0, 4).map((u) => (
              <button
                key={u}
                onClick={() => {
                  setUsername(u);
                  analyzeUsername(u);
                }}
                className="px-3 py-1.5 rounded-full border border-dark-400 text-slate-500 font-mono text-xs hover:border-cyan-400/40 hover:text-cyan-400 transition-all"
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function ProfileComparison({
  primaryData,
  secondaryData,
  primaryMeta,
  secondaryMeta,
  summary,
  onCopySummary,
  summaryCopied,
}) {
  if (!primaryData || !secondaryData || !summary) return null;

  const primaryRepos = primaryData.repositories || primaryData.topRepositories || [];
  const secondaryRepos = secondaryData.repositories || secondaryData.topRepositories || [];
  const primaryName = primaryData.profile?.login || "Primary";
  const secondaryName = secondaryData.profile?.login || "Secondary";
  const repoLimit = 4;

  return (
    <section className="w-full max-w-7xl space-y-5 animate-fade-up" style={{ opacity: 0 }}>
      <div className="glass-card border-gradient p-5 md:p-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
              Comparison
            </p>
            <h2 className="mt-2 font-mono text-2xl md:text-3xl font-bold text-white break-words">
              {primaryName} <span className="text-slate-500">vs</span> {secondaryName}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              {summary.primaryWins} wins for {primaryName}, {summary.secondaryWins} wins for {secondaryName}, {summary.ties} ties.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <span className="max-w-full rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 font-mono text-xs text-cyan-300">
              {summary.verdict}
            </span>
            <button
              type="button"
              onClick={onCopySummary}
              className="px-3 py-1.5 rounded-md border border-dark-400 text-[11px] font-mono text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
            >
              {summaryCopied ? "Summary Copied" : "Copy Summary"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
          <CompareProfileCard data={primaryData} meta={primaryMeta} side="left" />
          <div className="hidden lg:flex flex-col items-center justify-center px-2">
            <div className="h-full w-px bg-dark-400" />
            <span className="my-3 rounded-full border border-dark-400 bg-dark-700 px-3 py-1 font-mono text-xs text-slate-500">
              VS
            </span>
            <div className="h-full w-px bg-dark-400" />
          </div>
          <CompareProfileCard data={secondaryData} meta={secondaryMeta} side="right" />
        </div>
      </div>

      <div className="glass-card p-5 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
              Topic by Topic
            </p>
          </div>
          <p className="font-mono text-xs text-slate-500">
            Wins: {summary.primaryWins} - {summary.secondaryWins} / {summary.ties} ties
          </p>
        </div>

        <div className="space-y-3">
          {summary.metrics.map((metric) => (
            <CompareMetricRow
              key={metric.label}
              metric={metric}
              primaryName={primaryName}
              secondaryName={secondaryName}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ComparePanel title="Language Focus">
          <LanguageCompare
            primaryName={primaryName}
            secondaryName={secondaryName}
            primaryLanguages={primaryData.topLanguages || {}}
            secondaryLanguages={secondaryData.topLanguages || {}}
          />
        </ComparePanel>

        <ComparePanel title="Recent Activity">
          <ActivityCompare
            primaryName={primaryName}
            secondaryName={secondaryName}
            primaryActivity={primaryData.weeklyActivity}
            secondaryActivity={secondaryData.weeklyActivity}
          />
        </ComparePanel>
      </div>

      <ComparePanel title="Repository Snapshot">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RepoSnapshot name={primaryName} repos={primaryRepos.slice(0, repoLimit)} />
          <RepoSnapshot name={secondaryName} repos={secondaryRepos.slice(0, repoLimit)} />
        </div>
      </ComparePanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard name={primaryName} insight={primaryData.insight} />
        <InsightCard name={secondaryName} insight={secondaryData.insight} />
      </div>
    </section>
  );
}

function CompareProfileCard({ data, meta, side }) {
  const { profile, stats, topLanguages } = data;
  const joinYear = profile.created_at ? new Date(profile.created_at).getFullYear() : "N/A";
  const primaryLanguage = Object.keys(topLanguages || {})[0] || "Unknown";
  const analyzedAt = meta?.analyzedAt ? new Date(meta.analyzedAt).toLocaleTimeString() : null;

  return (
    <div className="rounded-xl border border-dark-400 bg-dark-700/45 p-4 md:p-5 min-w-0">
      <div className={`flex flex-col sm:flex-row gap-4 ${side === "right" ? "lg:flex-row-reverse lg:text-right" : ""}`}>
        <img
          src={profile.avatar_url}
          alt={profile.login}
          width={76}
          height={76}
          className="h-[76px] w-[76px] shrink-0 rounded-full ring-2 ring-cyan-400/35 object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-mono text-xl font-bold text-white break-words">
            {profile.name || profile.login}
          </h3>
          <p className="mt-1 font-mono text-sm text-cyan-300 break-all">@{profile.login}</p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed line-clamp-3">
            {profile.bio || "No bio available."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniStat label="Repos" value={stats.repos} />
        <MiniStat label="Stars" value={stats.stars} />
        <MiniStat label="Followers" value={profile.followers || 0} />
        <MiniStat label="Score" value={`${stats.score}/100`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] text-slate-400">
        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-cyan-300">
          {primaryLanguage}
        </span>
        <span className="rounded-full border border-dark-400 px-2.5 py-1">since {joinYear}</span>
        {analyzedAt && <span className="rounded-full border border-dark-400 px-2.5 py-1">analyzed {analyzedAt}</span>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-dark-400 bg-dark-800/40 px-3 py-2 min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 truncate">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-cyan-300 truncate">{value?.toLocaleString?.() ?? value}</p>
    </div>
  );
}

function CompareMetricRow({ metric, primaryName, secondaryName }) {
  const max = Math.max(metric.primaryValue, metric.secondaryValue, 1);
  const primaryWidth = `${Math.max(4, (metric.primaryValue / max) * 100)}%`;
  const secondaryWidth = `${Math.max(4, (metric.secondaryValue / max) * 100)}%`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_150px_1fr] gap-3 lg:gap-4 items-center rounded-xl border border-dark-400 bg-dark-700/35 p-3 md:p-4">
      <MetricSide
        name={primaryName}
        value={metric.primaryValue}
        width={primaryWidth}
        active={metric.winner === "primary"}
        align="left"
      />
      <div className="order-first lg:order-none text-left lg:text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">{metric.label}</p>
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          {metric.winner === "tie" ? "Tie" : metric.winner === "primary" ? `${shortenHandle(primaryName, 14)} leads` : `${shortenHandle(secondaryName, 14)} leads`}
        </p>
      </div>
      <MetricSide
        name={secondaryName}
        value={metric.secondaryValue}
        width={secondaryWidth}
        active={metric.winner === "secondary"}
        align="right"
      />
    </div>
  );
}

function MetricSide({ name, value, width, active, align }) {
  return (
    <div className="min-w-0">
      <div className={`mb-2 flex items-center gap-2 ${align === "right" ? "justify-between lg:justify-end" : "justify-between"}`}>
        <span className="font-mono text-xs text-slate-400 truncate" title={name}>{shortenHandle(name, 22)}</span>
        <span className={`font-mono text-sm font-bold ${active ? "text-cyan-300" : "text-slate-300"}`}>
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-dark-600 overflow-hidden">
        <div
          className={`h-full rounded-full ${active ? "bg-cyan-400" : "bg-slate-500/60"}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function ComparePanel({ title, children }) {
  return (
    <div className="glass-card p-5 md:p-6 overflow-hidden">
      <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function LanguageCompare({ primaryName, secondaryName, primaryLanguages, secondaryLanguages }) {
  const languages = Array.from(
    new Set([...Object.keys(primaryLanguages), ...Object.keys(secondaryLanguages)])
  ).slice(0, 7);
  const max = Math.max(
    1,
    ...languages.map((language) =>
      Math.max(primaryLanguages[language] || 0, secondaryLanguages[language] || 0)
    )
  );

  if (!languages.length) {
    return <p className="text-sm text-slate-500">No language data available.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_80px_1fr] gap-3 font-mono text-[11px] uppercase tracking-widest text-slate-500">
        <span className="truncate" title={primaryName}>{shortenHandle(primaryName, 18)}</span>
        <span className="text-center">Language</span>
        <span className="text-right truncate" title={secondaryName}>{shortenHandle(secondaryName, 18)}</span>
      </div>
      {languages.map((language) => (
        <div key={language} className="grid grid-cols-[1fr_80px_1fr] gap-3 items-center">
          <HorizontalValue value={primaryLanguages[language] || 0} max={max} reverse />
          <span className="text-center text-xs font-mono text-slate-300 truncate" title={language}>
            {language}
          </span>
          <HorizontalValue value={secondaryLanguages[language] || 0} max={max} />
        </div>
      ))}
    </div>
  );
}

function HorizontalValue({ value, max, reverse = false }) {
  const width = `${Math.max(value > 0 ? 6 : 0, (value / max) * 100)}%`;
  return (
    <div className={`flex items-center gap-2 ${reverse ? "flex-row-reverse" : ""}`}>
      <span className="w-7 shrink-0 font-mono text-xs text-slate-400">{value}</span>
      <div className={`h-2 flex-1 rounded-full bg-dark-600 overflow-hidden ${reverse ? "flex justify-end" : ""}`}>
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" style={{ width }} />
      </div>
    </div>
  );
}

function ActivityCompare({ primaryName, secondaryName, primaryActivity, secondaryActivity }) {
  const primaryValues = primaryActivity?.data || [];
  const secondaryValues = secondaryActivity?.data || [];
  const labels = primaryActivity?.labels || secondaryActivity?.labels || [];
  const max = Math.max(1, ...primaryValues, ...secondaryValues);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <ActivityMiniChart name={primaryName} values={primaryValues} labels={labels} max={max} />
        <ActivityMiniChart name={secondaryName} values={secondaryValues} labels={labels} max={max} />
      </div>
    </div>
  );
}

function ActivityMiniChart({ name, values, labels, max }) {
  return (
    <div className="min-w-0 rounded-xl border border-dark-400 bg-dark-700/35 p-3">
      <p className="mb-3 font-mono text-xs text-slate-300 truncate" title={name}>{name}</p>
      <div className="flex h-32 items-end gap-1.5">
        {values.map((value, index) => (
          <div key={`${labels[index] || index}-${index}`} className="flex-1 min-w-0">
            <div
              className="rounded-t bg-cyan-400/80"
              title={`${labels[index] || "Week"}: ${value}`}
              style={{ height: `${Math.max(value > 0 ? 8 : 2, (value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RepoSnapshot({ name, repos }) {
  return (
    <div className="min-w-0">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-500 truncate" title={name}>
        {name}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {repos.map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 rounded-xl border border-dark-400 bg-dark-700/35 p-3 hover:border-cyan-400/40 transition-colors"
          >
            <p className="font-mono text-sm font-semibold text-white truncate" title={repo.name}>{repo.name}</p>
            <p className="mt-2 min-h-[34px] text-xs text-slate-400 line-clamp-2">
              {repo.description || "No description provided"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] text-slate-400">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-cyan-300">
                {repo.language || "Unknown"}
              </span>
              <span>{repo.stars || 0} stars</span>
              <span>{repo.forks || 0} forks</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ name, insight }) {
  return (
    <div className="glass-card p-5 md:p-6 min-w-0">
      <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4 truncate" title={name}>
        AI Insight: {name}
      </p>
      <p className="border-l-2 border-cyan-400/40 pl-4 text-sm leading-relaxed text-slate-300">
        "{insight || "No insight available."}"
      </p>
    </div>
  );
}

function Dashboard({
  data,
  analysisMeta,
  onToggleFavorite,
  isFavorite,
  onShare,
  onExport,
  onReset,
  onCopyInsight,
  onCopyStats,
  copied,
  insightCopied,
  username,
  repos = [],
}) {
  const { profile, stats, topLanguages, weeklyActivity, topRepositories, repositories, insight } = data;

  const joinYear = new Date(profile.created_at).getFullYear();
  const blogUrl =
    profile.blog && profile.blog.startsWith("http")
      ? profile.blog
      : profile.blog
      ? `https://${profile.blog}`
      : "";

  const getDeveloperType = () => {
    const langs = Object.keys(topLanguages);
    const primary = langs[0] || "Unknown";

    const backendLangs = ["Python", "Go", "Rust", "Java", "C++", "C", "Ruby", "PHP", "C#"];
    const frontendLangs = ["JavaScript", "TypeScript", "CSS", "HTML", "Vue", "Svelte", "React"];
    const dataLangs = ["Python", "R", "Julia", "Scala"];

    if (dataLangs.includes(primary) && stats.repos > 5) return "Data Scientist";
    if (frontendLangs.includes(primary)) return "Frontend";
    if (backendLangs.includes(primary) && !frontendLangs.includes(primary)) return "Backend";
    if (langs.length > 4) return "Polyglot";
    return "Full-Stack";
  };

  const devType = getDeveloperType();
  const analyzedAtLabel = analysisMeta?.analyzedAt
    ? new Date(analysisMeta.analyzedAt).toLocaleTimeString()
    : null;

  return (
    <div className="w-full max-w-5xl space-y-5">
      <div className="glass-card border-gradient p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-fade-up" style={{ opacity: 0 }}>
        <div className="relative shrink-0">
          <img
            src={profile.avatar_url}
            alt={profile.login}
            width={80}
            height={80}
            className="rounded-full ring-2 ring-cyan-400/40"
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-dark-800" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-3 mb-1">
            <h2 className="font-mono text-xl font-bold text-white">
              {profile.name || profile.login}
            </h2>
            <span className="text-[10px] px-2.5 py-1 rounded-full border border-cyan-400/40 text-cyan-300 font-mono bg-cyan-400/5">
              {devType}
            </span>
            <span className="font-mono text-sm text-slate-500">@{profile.login}</span>
            <span className="font-mono text-xs text-slate-600">since {joinYear}</span>
          </div>

          {profile.bio && (
            <p className="text-slate-400 text-sm mb-3 leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-500">
            <span>👥 <strong className="text-slate-300">{profile.followers?.toLocaleString()}</strong> followers</span>
            <span>📡 <strong className="text-slate-300">{profile.following?.toLocaleString()}</strong> following</span>
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.company && <span>🏢 {profile.company}</span>}
            {profile.twitter_username && <span>🐦 @{profile.twitter_username}</span>}
            {blogUrl && (
              <a
                href={blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Website ↗
              </a>
            )}
            <a
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              View on GitHub ↗
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {analysisMeta?.durationMs && (
            <span className="px-2 py-1 rounded-md border border-dark-400 text-[11px] font-mono text-slate-400">
              {analysisMeta.durationMs}ms
            </span>
          )}
          {analyzedAtLabel && (
            <span className="px-2 py-1 rounded-md border border-dark-400 text-[11px] font-mono text-slate-400">
              analyzed {analyzedAtLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleFavorite(profile.login)}
            className="px-2.5 py-1 rounded-md border border-dark-400 text-[11px] font-mono text-slate-300 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
          >
            {isFavorite ? "Unfavorite" : "Favorite"}
          </button>
          <button
            type="button"
            onClick={onCopyStats}
            className="px-3 py-2 rounded-lg border border-dark-400 text-xs font-mono text-slate-300 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
          >
            Copy Stats
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-lg border border-dark-400 text-xs font-mono text-slate-300 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
          >
            Reset
          </button>
          <ExportShare username={username} data={data} analysisMeta={analysisMeta} repos={repos} />
          <button
            type="button"
            onClick={onShare}
            className="px-3 py-2 rounded-lg border border-dark-400 text-xs font-mono text-slate-300 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
          >
            {copied ? "Link Copied" : "Share"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          icon="📁"
          label="Repositories"
          value={stats.repos}
          subtitle="public repos"
          trend={stats.repos >= 20 ? "up" : "neutral"}
          trendLabel={stats.repos >= 20 ? "broad" : "building"}
          delay={100}
        />
        <StatsCard
          icon="⭐"
          label="Total Stars"
          value={stats.stars}
          subtitle="across all repos"
          trend={stats.avgStarsPerRepo >= 3 ? "up" : "neutral"}
          trendLabel={stats.avgStarsPerRepo >= 3 ? "impact" : "early"}
          delay={200}
        />
        <StatsCard
          icon="🍴"
          label="Total Forks"
          value={stats.forks}
          subtitle="times forked"
          trend={stats.forks >= 10 ? "up" : "neutral"}
          trendLabel={stats.forks >= 10 ? "shared" : "limited"}
          delay={300}
        />
        <StatsCard
          icon="🔥"
          label="Streak"
          value={stats.streak}
          subtitle="active weeks"
          trend={stats.streak >= 3 ? "up" : "down"}
          trendLabel={stats.streak >= 3 ? "consistent" : "watch"}
          delay={400}
        />
        <StatsCard
          icon="⚡"
          label="Active 90d"
          value={stats.activeRepos90d}
          subtitle="recently pushed"
          trend={stats.activeRepos90d >= 5 ? "up" : "neutral"}
          trendLabel={stats.activeRepos90d >= 5 ? "shipping" : "steady"}
          delay={500}
        />
        <StatsCard
          icon="🧠"
          label="Profile Health"
          value={`${stats.profileCompleteness}%`}
          subtitle="profile metadata"
          trend={stats.profileCompleteness >= 70 ? "up" : "down"}
          trendLabel={stats.profileCompleteness >= 70 ? "strong" : "improve"}
          delay={600}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProductivityMeter score={stats.score} />
        <div className="md:col-span-2">
          {Object.keys(topLanguages).length > 0 ? (
            <LanguageChart languages={topLanguages} />
          ) : (
            <div className="glass-card p-6 flex items-center justify-center h-full text-slate-500 font-mono text-sm">
              No language data available
            </div>
          )}
        </div>
      </div>

      <CommitChart weeklyActivity={weeklyActivity} />

      {Object.keys(topLanguages).length > 0 && (
        <LanguageBreakdown languages={topLanguages} totalRepos={stats.repos} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SignalCard
          title="Activity Signals"
          lines={[
            `Active in ${stats.activeWeeks}/12 tracked weeks`,
            `${stats.activeRepos30d} repos pushed in the last 30 days`,
            `${stats.activeRepos90d} repos pushed in the last 90 days`,
            `${stats.archivedRepos} archived repositories`,
          ]}
        />
        <SignalCard
          title="Quality Signals"
          lines={[
            `${stats.avgStarsPerRepo} average stars per repository`,
            `${profile.followers?.toLocaleString() || 0} followers on GitHub`,
            `${profile.public_repos?.toLocaleString() || 0} public repositories listed`,
            `Account active since ${joinYear}`,
          ]}
        />
      </div>

      <RepoHighlights repos={repositories || topRepositories || []} />

      <div
        className="glass-card p-6 animate-fade-up delay-600"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
              AI Developer Insight
            </h3>
          </div>
          <button
            type="button"
            onClick={onCopyInsight}
            className="px-2.5 py-1 rounded-md border border-dark-400 text-[11px] font-mono text-slate-400 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
          >
            {insightCopied ? "Copied" : "Copy Insight"}
          </button>
        </div>
        <p className="text-slate-300 leading-relaxed text-sm md:text-base italic border-l-2 border-cyan-400/40 pl-4">
          "{insight}"
        </p>
      </div>
    </div>
  );
}

function SignalCard({ title, lines }) {
  return (
    <div className="glass-card p-6 animate-fade-up" style={{ opacity: 0 }}>
      <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">
        {title}
      </h3>
      <ul className="space-y-3 text-sm text-slate-300">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
