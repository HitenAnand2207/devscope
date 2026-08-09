import { describe, it, expect } from 'vitest';
import { generateComparisonLink, generateShareableLink } from '../app/utils/exportUtils';

describe('export utils', () => {
  it('builds shareable profile links', () => {
    expect(generateShareableLink('octocat', 'https://example.com')).toBe(
      'https://example.com?user=octocat'
    );
  });

  it('builds comparison links for two users', () => {
    expect(generateComparisonLink('octocat', 'hubot', 'https://example.com')).toBe(
      'https://example.com?compare=octocat&vs=hubot'
    );
  });
});