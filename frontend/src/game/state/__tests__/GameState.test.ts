import { describe, expect, it } from 'vitest';
import {
  addScore,
  applyPlayerHit,
  completeCurrentLevel,
  createInitialGameState,
  grantPlayerBomb,
  grantPlayerShield,
  upgradePlayerWeapon,
  usePlayerBomb,
} from '../GameState';

describe('GameState pure transitions', () => {
  it('normalizes score, bomb, and weapon upgrades without exceeding limits', () => {
    const state = createInitialGameState();

    addScore(state, 10.9);
    addScore(state, -5);
    grantPlayerBomb(state, 20);

    expect(state.score).toBe(10);
    expect(state.bombs).toBe(9);
    expect(usePlayerBomb(state)).toBe(true);
    expect(state.bombs).toBe(8);

    expect(upgradePlayerWeapon(state)).toBe(true);
    expect(upgradePlayerWeapon(state)).toBe(true);
    expect(upgradePlayerWeapon(state)).toBe(false);
    expect(state.weaponLevel).toBe(3);
  });

  it('absorbs a hit with shield before health or lives are reduced', () => {
    const state = createInitialGameState();

    grantPlayerShield(state);

    expect(applyPlayerHit(state, 50, 1000)).toEqual({
      healthChanged: false,
      ignored: false,
      lifeLost: false,
      shieldAbsorbed: true,
    });
    expect(state.hasShield).toBe(false);
    expect(state.health).toBe(100);
    expect(state.lives).toBe(3);
  });

  it('uses invulnerability frames after damage and reports game over when lives run out', () => {
    const state = createInitialGameState();

    expect(applyPlayerHit(state, 40, 1000)).toMatchObject({
      healthChanged: true,
      ignored: false,
      lifeLost: false,
    });
    expect(state.health).toBe(60);
    expect(applyPlayerHit(state, 40, 1100)).toMatchObject({
      ignored: true,
    });

    expect(applyPlayerHit(state, 100, 2300)).toMatchObject({
      lifeLost: true,
    });
    expect(applyPlayerHit(state, 100, 3600)).toMatchObject({
      lifeLost: true,
    });
    expect(applyPlayerHit(state, 100, 4900)).toMatchObject({
      lifeLost: true,
    });
    expect(state.isGameOver).toBe(true);
    expect(state.runOutcome).toBe('game-over');
  });

  it('advances levels and emits a victory result on the final level', () => {
    const state = createInitialGameState();
    state.score = 500;

    expect(completeCurrentLevel(state)).toBeNull();
    expect(state.currentLevel).toBe(2);

    expect(completeCurrentLevel(state)).toBeNull();
    expect(state.currentLevel).toBe(3);

    expect(completeCurrentLevel(state)).toEqual({
      currentLevel: 3,
      outcome: 'victory',
      score: 500,
      totalLevels: 3,
    });
  });
});
