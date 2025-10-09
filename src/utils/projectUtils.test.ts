import path from 'node:path';
import { getFallbackSearchDirectory } from './projectUtils.js';

describe('getFallbackSearchDirectory', () => {
  it('returns the deepest ancestor within the max depth window', () => {
    const startDir = path.join('/workspace', 'projects', 'mcp', 'nested');
    const fallback = getFallbackSearchDirectory(startDir, 3);

    let expected = startDir;
    for (let i = 0; i < 3; i += 1) {
      const parent = path.dirname(expected);
      if (parent === expected) {
        break;
      }
      expected = parent;
    }

    expect(fallback).toBe(expected);
    expect(fallback).not.toBe(startDir);
  });
});
