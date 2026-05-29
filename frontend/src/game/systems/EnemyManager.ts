import Phaser from 'phaser';
import {
  DiveEnemy,
  Enemy,
  StraightEnemy,
  ZigZagEnemy,
  type EnemyKind,
} from '../entities/Enemy';
import type { PlayerPlane } from '../entities/PlayerPlane';
import { EnemyBulletPool } from './EnemyBulletPool';

type SpawnPoint = {
  kind: EnemyKind;
  xRatio: number;
  y: number;
};

const OPENING_SPAWNS: SpawnPoint[] = [
  { kind: 'straight', xRatio: 0.23, y: -48 },
  { kind: 'zigzag', xRatio: 0.5, y: -124 },
  { kind: 'dive', xRatio: 0.77, y: -204 },
];

const RESPAWN_DELAY_MS = 1_100;

export class EnemyManager {
  private readonly bulletPool: EnemyBulletPool;

  private readonly enemies: Enemy[] = [];

  private nextRespawnAt = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.bulletPool = new EnemyBulletPool(scene);
  }

  spawnOpeningEnemies(width: number): void {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }

    this.enemies.length = 0;

    for (const spawn of OPENING_SPAWNS) {
      this.enemies.push(
        this.createEnemy(spawn.kind, width * spawn.xRatio, spawn.y),
      );
    }
  }

  clearAll(): void {
    for (const enemy of this.enemies) {
      enemy.recycle();
    }

    this.bulletPool.recycleAll();
  }

  update(
    timeMs: number,
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
    player?: PlayerPlane,
  ): void {
    for (const enemy of this.enemies) {
      enemy.updateEnemy(timeMs, deltaMs, bounds, this.bulletPool, player);
    }

    this.bulletPool.update(deltaMs, bounds);
    this.respawnIfCleared(timeMs, bounds.width);
  }

  private respawnIfCleared(timeMs: number, width: number): void {
    if (this.enemies.some((enemy) => enemy.active)) {
      this.nextRespawnAt = timeMs + RESPAWN_DELAY_MS;
      return;
    }

    if (timeMs < this.nextRespawnAt) {
      return;
    }

    this.spawnOpeningEnemies(width);
    this.nextRespawnAt = timeMs + RESPAWN_DELAY_MS;
  }

  private createEnemy(kind: EnemyKind, x: number, y: number): Enemy {
    switch (kind) {
      case 'straight':
        return new StraightEnemy(this.scene, x, y);
      case 'zigzag':
        return new ZigZagEnemy(this.scene, x, y);
      case 'dive':
        return new DiveEnemy(this.scene, x, y);
    }
  }
}
