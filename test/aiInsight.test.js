import { describe, it, expect } from 'vitest';
import { generateInsight, buildActionableInsights } from '../app/utils/aiInsight';

describe('AI insight fallback', () => {
  it('returns a non-empty string when GROQ key is not set', async () => {
    // Ensure no GROQ key in environment for deterministic fallback
    delete process.env.GROQ_API_KEY;

    const data = {
      username: 'octocat',
      repos: 5,
      stars: 12,
      topLanguages: { JavaScript: 3, Python: 2 },
      score: 65,
      streak: 2,
      activeRepos90d: 1,
      profileCompleteness: 60,
    };

    const insight = await generateInsight(data);
    expect(typeof insight).toBe('string');
    expect(insight.length).toBeGreaterThan(10);
  });

  it('builds actionable insights for under-optimized profiles', () => {
    const insights = buildActionableInsights({
      username: 'octocat',
      stats: { repos: 4, stars: 7, score: 48, streak: 1, activeRepos90d: 2, profileCompleteness: 38 },
      profile: { followers: 12, public_repos: 4 },
      topLanguages: { JavaScript: 3, Python: 1 },
    });

    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some((item) => item.title.includes('Profile'))).toBe(true);
    expect(insights.some((item) => item.priority === 'high')).toBe(true);
  });
});
