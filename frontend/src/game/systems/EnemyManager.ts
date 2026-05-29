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

  private readonly group: Phaser.GameObjects.Group;

  constructor(private readonly scene: Phaser.Scene) {
    this.bulletPool = new EnemyBulletPool(scene);
    this.group = scene.add.group();
  }

  reset(): void {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }

    this.enemies.length = 0;
    this.group.clear(false, false);
    this.bulletPool.recycleAll();
  }

  spawnEnemy(kind: EnemyKind, x: number, y: number): void {
    const enemy = this.createEnemy(kind, x, y);
    this.enemies.push(enemy);
    this.group.add(enemy);
  }

  clearAll(): void {
    for (const enemy of this.enemies) {
      enemy.recycle();
    }

    this.bulletPool.recycleAll();
  }

  getEnemyBulletGroup(): Phaser.GameObjects.Group {
    return this.bulletPool.getGroup();
  }

  getGroup(): Phaser.GameObjects.Group {
    return this.group;
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

      this.group.remove(this.enemies[index], false, false);
      this.enemies[index].destroy();
      this.enemies.splice(index, 1);
    }
  }
}
