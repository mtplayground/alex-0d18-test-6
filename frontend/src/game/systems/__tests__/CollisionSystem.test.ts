import { describe, expect, it } from 'vitest';
import { COLLISION_DAMAGE, canProcessCollisionPair } from '../collisionRules';

describe('CollisionSystem pure helpers', () => {
  it('keeps collision damage values stable', () => {
    expect(COLLISION_DAMAGE).toEqual({
      enemyBullet: 28,
      enemyContact: 34,
      playerBullet: 1,
    });
  });

  it('processes collisions only when both participants are active', () => {
    expect(canProcessCollisionPair({ active: true }, { active: true })).toBe(
      true,
    );
    expect(canProcessCollisionPair({ active: false }, { active: true })).toBe(
      false,
    );
    expect(canProcessCollisionPair({ active: true }, { active: false })).toBe(
      false,
    );
    expect(canProcessCollisionPair(null, { active: true })).toBe(false);
  });
});
