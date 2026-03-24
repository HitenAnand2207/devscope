// ─────────────────────────────────────────────
//  utils/github.js
//  All GitHub API fetching logic lives here.
//  We export simple async functions that the
//  Next.js API route (or page) can call.
// ─────────────────────────────────────────────

const BASE = "https://api.github.com";

// Helper: attach auth header if token provided
function headers() {
  const token = process.env.GITHUB_TOKEN;
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
    : { Accept: "application/vnd.github+json" };
}

async function githubFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    next: { revalidate: 900 },
  });

  if (res.status === 404) {
    throw new Error("User not found");
  }

  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      throw new Error("GitHub rate limit exceeded");
    }
  }

  if (!res.ok) {
    throw new Error("GitHub API error");
  }

  return res.json();
}

// ── 1. Fetch basic user profile ──────────────
export async function fetchUser(username) {
  return githubFetch(`/users/${username}`);
}

// ── 2. Fetch all public repos (up to 300) ────
export async function fetchRepos(username) {
  const allRepos = [];

  for (let page = 1; page <= 3; page++) {
    const repos = await githubFetch(
      `/users/${username}/repos?per_page=100&page=${page}&sort=pushed`
    );

    allRepos.push(...repos);

    if (repos.length < 100) {
      break;
    }
  }

  return allRepos;
}

// ── 3. Calculate language distribution ───────
//  Sums up the declared language for each repo
//  and returns an object like { JavaScript: 12, Python: 8 }
export function calcLanguages(repos) {
  const langs = {};
  for (const repo of repos) {
    if (repo.language) {
      langs[repo.language] = (langs[repo.language] || 0) + 1;
    }
  }
  // Sort descending by count, keep top 8
  return Object.fromEntries(
    Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  );
}

// ── 4. Calculate total stars across all repos ─
export function calcTotalStars(repos) {
  return repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
}

// ── 5. Calculate total forks ──────────────────
export function calcTotalForks(repos) {
  return repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
}

// ── 6. Estimate weekly commit activity ────────
//  GitHub gives a `pushed_at` per repo.
//  We bucket repos by the week they were last
//  pushed to, giving a rough activity heatmap.
export function calcWeeklyActivity(repos) {
  const weeks = {};
  const now = Date.now();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  for (const repo of repos) {
    if (!repo.pushed_at) continue;
    const pushed = new Date(repo.pushed_at).getTime();
    const weeksAgo = Math.floor((now - pushed) / ONE_WEEK);
    if (weeksAgo <= 11) {
      // Only show last 12 weeks
      weeks[weeksAgo] = (weeks[weeksAgo] || 0) + 1;
    }
  }

  // Build ordered array: oldest → newest
  const labels = [];
  const data = [];
  for (let i = 11; i >= 0; i--) {
    labels.push(i === 0 ? "This wk" : `${i}w ago`);
    data.push(weeks[i] || 0);
  }
  return { labels, data };
}

// ── 7. Productivity score ─────────────────────
//  Formula: commits_estimate + repos*5 + stars*2
//  We estimate commits as repos * avg 8 commits
export function calcProductivityScore(repos, stars) {
  const estimatedCommits = repos.length * 8;
  const raw = estimatedCommits + repos.length * 5 + stars * 2;
  // Clamp to 0–100 for display
  return Math.min(100, Math.round(raw / 10));
}

export function calcAvgStarsPerRepo(repos, stars) {
  if (!repos.length) return 0;
  return Number((stars / repos.length).toFixed(2));
}

export function calcVelocityStats(repos) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const activeRepos30d = repos.filter((repo) => {
    if (!repo.pushed_at) return false;
    return now - new Date(repo.pushed_at).getTime() <= 30 * DAY;
  }).length;

  const activeRepos90d = repos.filter((repo) => {
    if (!repo.pushed_at) return false;
    return now - new Date(repo.pushed_at).getTime() <= 90 * DAY;
  }).length;

  const archivedRepos = repos.filter((repo) => repo.archived).length;

  return {
    activeRepos30d,
    activeRepos90d,
    archivedRepos,
  };
}

export function calcConsistencyStats(weeklyActivity) {
  const values = weeklyActivity?.data || [];

  const activeWeeks = values.filter((v) => v > 0).length;

  let streak = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return { activeWeeks, streak };
}

export function calcTopRepositories(repos, limit = 6) {
  return [...repos]
    .sort((a, b) => {
      if ((b.stargazers_count || 0) !== (a.stargazers_count || 0)) {
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      }
      return (b.forks_count || 0) - (a.forks_count || 0);
    })
    .slice(0, limit)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      pushed_at: repo.pushed_at,
      html_url: repo.html_url,
      archived: repo.archived,
    }));
}

export function calcProfileCompleteness(user) {
  const checks = [
    Boolean(user.name),
    Boolean(user.bio),
    Boolean(user.location),
    Boolean(user.blog),
    Boolean(user.company),
    Boolean(user.twitter_username),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}