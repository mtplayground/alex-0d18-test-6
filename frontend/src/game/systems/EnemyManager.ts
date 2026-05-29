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

export class EnemyManager {
  private readonly bulletPool: EnemyBulletPool;

  private readonly enemies: Enemy[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.bulletPool = new EnemyBulletPool(scene);
  }

  reset(): void {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }

    this.enemies.length = 0;
    this.bulletPool.recycleAll();
  }

  spawnEnemy(kind: EnemyKind, x: number, y: number): void {
    this.enemies.push(this.createEnemy(kind, x, y));
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
    this.removeInactiveEnemies();
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

  private removeInactiveEnemies(): void {
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      if (this.enemies[index].active) {
        continue;
      }

      this.enemies[index].destroy();
      this.enemies.splice(index, 1);
    }
  }
}
