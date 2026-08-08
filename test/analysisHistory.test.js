import { describe, it, expect } from 'vitest';
import { appendAnalysisHistory } from '../app/utils/analysisHistory';

describe('analysis history helpers', () => {
  it('appends a new analysis entry and keeps the latest entries', () => {
    const history = [
      { username: 'octocat', analyzedAt: '2024-01-01T00:00:00.000Z' },
      { username: 'torvalds', analyzedAt: '2024-01-02T00:00:00.000Z' },
    ];

    const next = appendAnalysisHistory(history, { username: 'gaearon', analyzedAt: '2024-01-03T00:00:00.000Z' }, 3);

    expect(next[0].username).toBe('gaearon');
    expect(next).toHaveLength(3);
    expect(next.some((entry) => entry.username === 'octocat')).toBe(true);
  });

  it('deduplicates repeated user entries while preserving recency', () => {
    const history = [
      { username: 'octocat', analyzedAt: '2024-01-01T00:00:00.000Z' },
    ];

    const next = appendAnalysisHistory(history, { username: 'octocat', analyzedAt: '2024-01-04T00:00:00.000Z' }, 4);

    expect(next).toHaveLength(1);
    expect(next[0].analyzedAt).toBe('2024-01-04T00:00:00.000Z');
  });
});
