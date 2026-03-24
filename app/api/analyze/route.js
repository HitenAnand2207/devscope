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
  calcProfileCompleteness,
} from "../../utils/github";
import { generateInsight } from "../../utils/aiInsight";

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

    // ── Return full payload ───────────────────
    return NextResponse.json({
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
      insight,
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