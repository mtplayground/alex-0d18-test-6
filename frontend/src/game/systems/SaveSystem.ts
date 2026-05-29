import type { RunResult } from '../state/GameState';

export type SaveData = {
  bestScore: number;
  highestLevel: number;
};

const DEFAULT_SAVE: SaveData = {
  bestScore: 0,
  highestLevel: 1,
};

const SAVE_KEY = 'alex-0d18-test-6.save.v1';

export class SaveSystem {
  read(): SaveData {
    const storage = this.getStorage();

    if (!storage) {
      return { ...DEFAULT_SAVE };
    }

    try {
      const rawValue = storage.getItem(SAVE_KEY);

      if (!rawValue) {
        return { ...DEFAULT_SAVE };
      }

      return this.normalizeSave(JSON.parse(rawValue));
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  updateFromRun(result: RunResult): SaveData {
    const currentSave = this.read();
    const nextSave: SaveData = {
      bestScore: Math.max(
        currentSave.bestScore,
        this.normalizeScore(result.score),
      ),
      highestLevel: Math.max(
        currentSave.highestLevel,
        this.getHighestLevelFromResult(result),
      ),
    };

    const storage = this.getStorage();

    if (!storage) {
      return nextSave;
    }

    try {
      storage.setItem(SAVE_KEY, JSON.stringify(nextSave));
    } catch {
      return nextSave;
    }

    return nextSave;
  }

  private getStorage(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private normalizeSave(value: unknown): SaveData {
    if (!this.isSaveRecord(value)) {
      return { ...DEFAULT_SAVE };
    }

    return {
      bestScore: this.normalizeScore(value.bestScore),
      highestLevel: Math.max(1, Math.floor(value.highestLevel)),
    };
  }

  private normalizeScore(score: number): number {
    if (!Number.isFinite(score) || score <= 0) {
      return 0;
    }

    return Math.floor(score);
  }

  private getHighestLevelFromResult(result: RunResult): number {
    if (result.outcome === 'victory') {
      return Math.max(1, Math.floor(result.totalLevels));
    }

    return Math.max(1, Math.floor(result.currentLevel));
  }

  private isSaveRecord(value: unknown): value is SaveData {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<SaveData>;

    return (
      typeof candidate.bestScore === 'number' &&
      typeof candidate.highestLevel === 'number'
    );
  }
}
