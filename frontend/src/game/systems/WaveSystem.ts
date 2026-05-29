import type { EnemyKind } from '../entities/Enemy';
import type { EnemyManager } from './EnemyManager';

export type WaveSpawn = {
  atMs: number;
  count?: number;
  enemy: EnemyKind;
  intervalMs?: number;
  xRatio: number;
  xStepRatio?: number;
  y?: number;
};

export type WaveScript = {
  durationMs: number;
  loop: boolean;
  spawns: WaveSpawn[];
};

type ScheduledSpawn = {
  atMs: number;
  enemy: EnemyKind;
  xRatio: number;
  y: number;
};

const DEFAULT_SPAWN_Y = -56;

export class WaveSystem {
  private elapsedMs = 0;

  private nextSpawnIndex = 0;

  private readonly schedule: ScheduledSpawn[];

  constructor(
    private readonly enemyManager: EnemyManager,
    private readonly script: WaveScript,
  ) {
    this.schedule = this.expandSchedule(script.spawns);
  }

  update(deltaMs: number, width: number): void {
    if (this.schedule.length === 0) {
      return;
    }

    this.elapsedMs += deltaMs;
    this.spawnDueEnemies(width);
    this.restartIfLooping(width);
  }

  reset(): void {
    this.elapsedMs = 0;
    this.nextSpawnIndex = 0;
  }

  isComplete(): boolean {
    return (
      !this.script.loop &&
      this.elapsedMs >= this.script.durationMs &&
      this.nextSpawnIndex >= this.schedule.length
    );
  }

  private spawnDueEnemies(width: number): void {
    while (
      this.nextSpawnIndex < this.schedule.length &&
      this.schedule[this.nextSpawnIndex].atMs <= this.elapsedMs
    ) {
      const spawn = this.schedule[this.nextSpawnIndex];
      this.enemyManager.spawnEnemy(spawn.enemy, width * spawn.xRatio, spawn.y);
      this.nextSpawnIndex += 1;
    }
  }

  private restartIfLooping(width: number): void {
    if (!this.script.loop || this.elapsedMs < this.script.durationMs) {
      return;
    }

    this.elapsedMs %= this.script.durationMs;
    this.nextSpawnIndex = 0;
    this.spawnDueEnemies(width);
  }

  private expandSchedule(spawns: WaveSpawn[]): ScheduledSpawn[] {
    return spawns
      .flatMap((spawn) => this.expandSpawn(spawn))
      .sort((first, second) => first.atMs - second.atMs);
  }

  private expandSpawn(spawn: WaveSpawn): ScheduledSpawn[] {
    const count = Math.max(1, Math.floor(spawn.count ?? 1));
    const intervalMs = Math.max(0, spawn.intervalMs ?? 0);
    const xStepRatio = spawn.xStepRatio ?? 0;

    return Array.from({ length: count }, (_, index) => ({
      atMs: spawn.atMs + intervalMs * index,
      enemy: spawn.enemy,
      xRatio: this.clampRatio(spawn.xRatio + xStepRatio * index),
      y: spawn.y ?? DEFAULT_SPAWN_Y,
    }));
  }

  private clampRatio(value: number): number {
    return Math.min(0.94, Math.max(0.06, value));
  }
}
