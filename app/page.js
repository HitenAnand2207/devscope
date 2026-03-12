"use client";
// ─────────────────────────────────────────────
//  app/page.js  —  Main Page
//
//  "use client" lets us use React state (useState)
//  and event handlers directly in this file.
//
//  Flow:
//  1. User types username → clicks Analyze
//  2. We POST to /api/analyze
//  3. Show skeleton while loading
//  4. Render the full dashboard on success
// ─────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";
import StatsCard from "./components/StatsCard";
import LanguageChart from "./components/LanguageChart";
import CommitChart from "./components/CommitChart";
import ProductivityMeter from "./components/ProductivityMeter";
import LoadingSkeleton from "./components/LoadingSkeleton";

export default function Home() {
  // ── State ─────────────────────────────────
  const [username, setUsername] = useState("");
  const [data, setData] = useState(null);         // API response
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Handle form submission ─────────────────
  async function handleAnalyze(e) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Server returned an error (404, 400, 500)
        setError(json.error || "Something went wrong.");
      } else {
        setData(json);
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────
  return (
    <main className="relative z-10 min-h-screen px-4 py-12 flex flex-col items-center">

      {/* ── Hero Header ── */}
      <header className="text-center mb-12 animate-fade-up" style={{ opacity: 0 }}>
        {/* Decorative badge */}
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
          Deep-dive into any GitHub developer's activity, languages, and productivity.
        </p>
      </header>

      {/* ── Search Form ── */}
      <form
        onSubmit={handleAnalyze}
        className="w-full max-w-xl flex gap-3 mb-12 animate-fade-up delay-200"
        style={{ opacity: 0 }}
      >
        <div className="relative flex-1">
          {/* GitHub icon inside input */}
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm select-none">
            github.com/
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
      </form>

      {/* ── Error Banner ── */}
      {error && (
        <div className="w-full max-w-xl mb-8 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-sm animate-fade-up" style={{ opacity: 0 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && <LoadingSkeleton />}

      {/* ── Dashboard ── */}
      {data && !loading && (
        <Dashboard data={data} />
      )}

      {/* ── Empty state (before first search) ── */}
      {!data && !loading && !error && (
        <div className="text-center mt-8 animate-fade-up delay-300" style={{ opacity: 0 }}>
          <div className="text-6xl mb-4">🔭</div>
          <p className="text-slate-600 font-mono text-sm">
            Enter a GitHub username above to get started
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["torvalds", "gaearon", "yyx990803", "sindresorhus"].map((u) => (
              <button
                key={u}
                onClick={() => setUsername(u)}
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

// ─────────────────────────────────────────────
//  Dashboard — rendered after successful fetch
// ─────────────────────────────────────────────
function Dashboard({ data }) {
  const { profile, stats, topLanguages, weeklyActivity, insight } = data;

  // Format the join date
  const joinYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="w-full max-w-5xl space-y-5">

      {/* ── Profile Card ── */}
      <div className="glass-card border-gradient p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-fade-up" style={{ opacity: 0 }}>
        {/* Avatar */}
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-3 mb-1">
            <h2 className="font-mono text-xl font-bold text-white">
              {profile.name || profile.login}
            </h2>
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
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon="📁"
          label="Repositories"
          value={stats.repos}
          subtitle="public repos"
          delay={100}
        />
        <StatsCard
          icon="⭐"
          label="Total Stars"
          value={stats.stars}
          subtitle="across all repos"
          delay={200}
        />
        <StatsCard
          icon="🍴"
          label="Total Forks"
          value={stats.forks}
          subtitle="times forked"
          delay={300}
        />
        <StatsCard
          icon="👥"
          label="Followers"
          value={profile.followers}
          subtitle="GitHub followers"
          delay={400}
        />
      </div>

      {/* ── Productivity + Language chart ── */}
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

      {/* ── Commit / activity chart ── */}
      <CommitChart weeklyActivity={weeklyActivity} />

      {/* ── AI Insight ── */}
      <div
        className="glass-card p-6 animate-fade-up delay-600"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-slate-500">
            AI Developer Insight
          </h3>
        </div>
        <p className="text-slate-300 leading-relaxed text-sm md:text-base italic border-l-2 border-cyan-400/40 pl-4">
          "{insight}"
        </p>
      </div>

    </div>
  );
}