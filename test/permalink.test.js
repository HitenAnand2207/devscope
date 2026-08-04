import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { POST } from '../app/api/permalink/route';

const STORE_PATH = path.resolve(process.cwd(), 'data', 'permalinks.json');

describe('Permalink API', () => {
  beforeEach(async () => {
    try {
      await fs.promises.unlink(STORE_PATH);
    } catch (e) {
      // ignore
    }
  });

  it('creates a permalink via POST and writes to store', async () => {
    const payload = { profile: { login: 'testuser' }, stats: { repos: 1 }, languages: {} };
    const mockReq = {
      json: async () => ({ payload }),
      nextUrl: new URL('http://localhost'),
      url: 'http://localhost/api/permalink',
    };

    await POST(mockReq);

    const raw = await fs.promises.readFile(STORE_PATH, 'utf8');
    const store = JSON.parse(raw || '{}');
    const keys = Object.keys(store);
    expect(keys.length).toBeGreaterThan(0);
    const entry = store[keys[0]];
    expect(entry.payload.profile.login).toBe('testuser');
  });
});
