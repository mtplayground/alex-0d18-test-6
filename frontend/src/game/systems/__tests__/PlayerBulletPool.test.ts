import { describe, expect, it } from 'vitest';
import {
  canFirePlayerBulletPattern,
  getPlayerBulletPattern,
} from '../playerBulletPatterns';

describe('PlayerBulletPool pattern helpers', () => {
  it('returns the expected shot pattern for each weapon level', () => {
    expect(getPlayerBulletPattern(1)).toEqual([
      {
        horizontalSpeed: 0,
        offsetX: 0,
      },
    ]);
    expect(getPlayerBulletPattern(2)).toEqual([
      {
        horizontalSpeed: -180,
        offsetX: -14,
      },
      {
        horizontalSpeed: 0,
        offsetX: 0,
      },
      {
        horizontalSpeed: 180,
        offsetX: 14,
      },
    ]);
    expect(getPlayerBulletPattern(3)).toHaveLength(5);
  });

  it('requires enough inactive bullets for the full pattern', () => {
    expect(canFirePlayerBulletPattern(1, 1)).toBe(true);
    expect(canFirePlayerBulletPattern(2, 2)).toBe(false);
    expect(canFirePlayerBulletPattern(3, 2)).toBe(true);
    expect(canFirePlayerBulletPattern(4, 3)).toBe(false);
    expect(canFirePlayerBulletPattern(5, 3)).toBe(true);
  });
});
