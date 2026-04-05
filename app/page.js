"use client";
import { useEffect, useState } from "react";
import StatsCard from "./components/StatsCard";
import LanguageChart from "./components/LanguageChart";
import LanguageBreakdown from "./components/LanguageBreakdown";
import CommitChart from "./components/CommitChart";
import ProductivityMeter from "./components/ProductivityMeter";
import LoadingSkeleton from "./components/LoadingSkeleton";
import RepoHighlights from "./components/RepoHighlights";

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

export default function Home() {
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

      {data && !loading && (
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
}) {
  const { profile, stats, topLanguages, weeklyActivity, topRepositories, insight } = data;

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
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-2 rounded-lg border border-dark-400 text-xs font-mono text-slate-300 hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
          >
            Download JSON
          </button>
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

      <RepoHighlights repos={topRepositories || []} />

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