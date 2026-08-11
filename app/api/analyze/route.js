// ─────────────────────────────────────────────
//  app/api/analyze/route.js
//  Next.js App Router API Route
//
//  POST /api/analyze
//  Body: { username: "torvalds" }
//
//  Fetches GitHub data + generates AI insight,
//  returns a single JSON payload to the client.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import {
  fetchUser,
  fetchRepos,
  calcLanguages,
  calcTotalStars,
  calcTotalForks,
  calcWeeklyActivity,
  calcProductivityScore,
  calcAvgStarsPerRepo,
  calcVelocityStats,
  calcConsistencyStats,
  calcTopRepositories,
  normalizeRepositories,
  calcProfileCompleteness,
} from "../../utils/github";
import { generateInsight } from "../../utils/aiInsight";

// Module-level maps (persist for the lifetime of the server process)
const _cache = new Map(); // username -> { payload, expiresAt }
const _rate = new Map(); // ip -> { count, resetAt }

function getClientIp(request) {
  try {
    // Prefer x-forwarded-for, fallback to connection metadata if available
    const xf = request.headers.get('x-forwarded-for');
    if (xf) {
      const first = xf.split(',')[0].trim();
      // strip IPv6 prefix if present
      return first.replace(/^::ffff:/, '');
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.replace(/^::ffff:/, '');
  } catch (e) {
    // ignore
  }
  return 'unknown';
}

function checkRateLimit(ip, limit = 60, windowMs = 60 * 1000) {
  const now = Date.now();
  const entry = _rate.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  _rate.set(ip, entry);
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
}

function getCached(username) {
  const now = Date.now();
  const entry = _cache.get(username);
  if (!entry) return null;
  if (entry.expiresAt < now) {
    _cache.delete(username);
    return null;
  }
  return entry.payload;
}

function setCached(username, payload, ttlMs = 60 * 1000) {
  _cache.set(username, { payload, expiresAt: Date.now() + ttlMs });
}

export async function POST(request) {
  try {
    // ── Parse request body ────────────────────
    const { username } = await request.json();

    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { error: "Please enter a valid GitHub username." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length > 39) {
      return NextResponse.json({ error: 'Username too long' }, { status: 400 });
    }

    // Rate limiting per IP
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 40, 60 * 1000); // 40 requests / minute
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(rl.resetAt) } }
      );
    }

    // Check in-process cache
    const cached = getCached(cleanUsername);
    if (cached) {
      return NextResponse.json(cached, { status: 200, headers: { 'X-Cache': 'HIT', 'X-RateLimit-Remaining': String(rl.remaining) } });
    }

    // ── Fetch GitHub data in parallel ─────────
    const [user, repos] = await Promise.all([
      fetchUser(cleanUsername),
      fetchRepos(cleanUsername),
    ]);

    // ── Compute derived stats ─────────────────
    const stars = calcTotalStars(repos);
    const forks = calcTotalForks(repos);
    const topLanguages = calcLanguages(repos);
    const weeklyActivity = calcWeeklyActivity(repos);
    const score = calcProductivityScore(repos, stars);
    const avgStarsPerRepo = calcAvgStarsPerRepo(repos, stars);
    const velocity = calcVelocityStats(repos);
    const consistency = calcConsistencyStats(weeklyActivity);
    const topRepositories = calcTopRepositories(repos, 6);
    const repositories = normalizeRepositories(repos);
    const profileCompleteness = calcProfileCompleteness(user);

    // ── Generate AI insight ───────────────────
    const insight = await generateInsight({
      username: user.login,
      repos: repos.length,
      stars,
      topLanguages,
      score,
      avgStarsPerRepo,
      activeRepos90d: velocity.activeRepos90d,
      activeRepos30d: velocity.activeRepos30d,
      archivedRepos: velocity.archivedRepos,
      activeWeeks: consistency.activeWeeks,
      streak: consistency.streak,
      profileCompleteness,
    });

    // ── Return full payload (cache on CDN for short period) ──
    const payload = {
      profile: {
        login: user.login,
        name: user.name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        followers: user.followers,
        following: user.following,
        location: user.location,
        company: user.company,
        blog: user.blog,
        twitter_username: user.twitter_username,
        public_repos: user.public_repos,
        created_at: user.created_at,
      },
      stats: {
        repos: repos.length,
        stars,
        forks,
        score,
        avgStarsPerRepo,
        activeRepos90d: velocity.activeRepos90d,
        activeRepos30d: velocity.activeRepos30d,
        archivedRepos: velocity.archivedRepos,
        activeWeeks: consistency.activeWeeks,
        streak: consistency.streak,
        profileCompleteness,
      },
      topLanguages,
      weeklyActivity,
      topRepositories,
      repositories,
      insight,
    };

    // Cache result for a short time to reduce GitHub/API calls
    try { setCached(cleanUsername, payload, 60 * 1000); } catch (e) { /* ignore */ }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        // Let Vercel / CDN cache the analysis for a short time while allowing revalidation
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  } catch (err) {
    // Handle known errors with friendly messages
    if (err.message === "User not found") {
      return NextResponse.json(
        { error: "GitHub user not found. Please check the username and try again." },
        { status: 404 }
      );
    }

    if (err.message === "GitHub rate limit exceeded") {
      return NextResponse.json(
        {
          error:
            "GitHub rate limit exceeded. Add a GITHUB_TOKEN in .env.local or wait for reset.",
        },
        { status: 429 }
      );
    }

    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

// Support GET /api/analyze?username=... for linkable requests
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    if (!username) {
      return NextResponse.json({ error: 'Please provide a username query parameter' }, { status: 400 });
    }

    // Reuse the POST logic by constructing a minimal body-like object
    // Create a shallow clone of request so getClientIp and headers are preserved
    const fakeRequest = request;
    // Attach a json() method that returns the expected shape
    fakeRequest.json = async () => ({ username });
    return await POST(fakeRequest);
  } catch (e) {
    console.error('GET /api/analyze error', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}