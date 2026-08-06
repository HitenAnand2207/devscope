import { describe, it, expect } from 'vitest';
import {
  calcLanguages,
  calcTotalStars,
  calcTotalForks,
  calcAvgStarsPerRepo,
  calcProductivityScore,
  calcProfileCompleteness,
  calcVelocityStats,
  calcConsistencyStats,
  calcWeeklyActivity,
} from '../app/utils/github';
import { generateMarkdownSummary } from '../app/utils/exportUtils';

const sampleRepos = [
  { id: 1, name: 'a', language: 'JavaScript', stargazers_count: 5, forks_count: 1, pushed_at: new Date().toISOString(), archived: false, watchers_count: 2, size: 10, created_at: new Date().toISOString(), html_url: 'https://example.com' },
  { id: 2, name: 'b', language: 'Python', stargazers_count: 3, forks_count: 0, pushed_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), archived: false, watchers_count: 1, size: 20, created_at: new Date().toISOString(), html_url: 'https://example.com' },
  { id: 3, name: 'c', language: 'JavaScript', stargazers_count: 2, forks_count: 4, pushed_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), archived: true, watchers_count: 0, size: 5, created_at: new Date().toISOString(), html_url: 'https://example.com' },
];

describe('GitHub utils', () => {
  it('calculates language counts', () => {
    const langs = calcLanguages(sampleRepos);
    expect(langs.JavaScript).toBe(2);
    expect(langs.Python).toBe(1);
  });

  it('calculates total stars and forks', () => {
    expect(calcTotalStars(sampleRepos)).toBe(10);
    expect(calcTotalForks(sampleRepos)).toBe(5);
  });

  it('calculates average stars per repo', () => {
    expect(calcAvgStarsPerRepo(sampleRepos, 10)).toBeCloseTo(10 / 3, 2);
  });

  it('computes a productivity score between 0 and 100', () => {
    const score = calcProductivityScore(sampleRepos, 10);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('estimates velocity and archived repos', () => {
    const v = calcVelocityStats(sampleRepos);
    expect(v.archivedRepos).toBe(1);
    expect(typeof v.activeRepos30d).toBe('number');
  });

  it('computes weekly activity and consistency', () => {
    const weekly = calcWeeklyActivity(sampleRepos);
    expect(weekly.labels.length).toBe(12);
    const c = calcConsistencyStats(weekly);
    expect(typeof c.streak).toBe('number');
  });

  it('computes profile completeness', () => {
    const user = { name: 'X', bio: 'b', location: null, blog: '', company: '', twitter_username: '' };
    expect(calcProfileCompleteness(user)).toBeGreaterThanOrEqual(0);
    expect(calcProfileCompleteness(user)).toBeLessThanOrEqual(100);
  });

  it('generates markdown summaries for export', () => {
    const summary = generateMarkdownSummary({ profile: { login: 'octocat' }, stats: { repos: 3, stars: 8, forks: 2, score: 74 }, languages: { JavaScript: 2 } });
    expect(summary).toContain('DevScope Analysis');
    expect(summary).toContain('octocat');
    expect(summary).toContain('JavaScript');
  });
});
