import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RunResult } from '../../state/GameState';
import { SaveSystem } from '../SaveSystem';

const SAVE_KEY = 'alex-0d18-test-6.save.v1';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const gameOverResult = (score: number, currentLevel = 1): RunResult => ({
  currentLevel,
  outcome: 'game-over',
  score,
  totalLevels: 3,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SaveSystem', () => {
  it('returns defaults when localStorage is empty or malformed', () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);

    expect(new SaveSystem().read()).toEqual({
      bestScore: 0,
      highestLevel: 1,
    });

    storage.setItem(SAVE_KEY, '{bad json');

    expect(new SaveSystem().read()).toEqual({
      bestScore: 0,
      highestLevel: 1,
    });
  });

  it('normalizes stored values when reading localStorage', () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        bestScore: 100.9,
        highestLevel: 2.8,
      }),
    );

    expect(new SaveSystem().read()).toEqual({
      bestScore: 100,
      highestLevel: 2,
    });
  });

  it('keeps the best score and highest reached level after a run', () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    const saveSystem = new SaveSystem();

    expect(saveSystem.updateFromRun(gameOverResult(200.9, 2))).toEqual({
      bestScore: 200,
      highestLevel: 2,
    });
    expect(saveSystem.updateFromRun(gameOverResult(50, 1))).toEqual({
      bestScore: 200,
      highestLevel: 2,
    });
  });

  it('records total levels after a victory', () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);

    expect(
      new SaveSystem().updateFromRun({
        currentLevel: 3,
        outcome: 'victory',
        score: 500,
        totalLevels: 3,
      }),
    ).toEqual({
      bestScore: 500,
      highestLevel: 3,
    });
  });
});
