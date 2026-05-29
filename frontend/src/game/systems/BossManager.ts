import Phaser from 'phaser';
import { Boss } from '../entities/Boss';
import type { BossStatus } from '../entities/Boss';
import type { PlayerPlane } from '../entities/PlayerPlane';
import { EnemyBulletPool } from './EnemyBulletPool';

export class BossManager {
  private boss?: Boss;

  private readonly bossGroup: Phaser.GameObjects.Group;

  private readonly bulletPool: EnemyBulletPool;

  constructor(private readonly scene: Phaser.Scene) {
    this.bossGroup = scene.add.group();
    this.bulletPool = new EnemyBulletPool(scene);
  }

  spawnBoss(x: number, y: number): void {
    this.clearBoss();
    this.boss = new Boss(this.scene, x, y);
    this.bossGroup.add(this.boss);
  }

  clearBoss(): void {
    if (this.boss) {
      this.bossGroup.remove(this.boss, false, false);
      this.boss.destroy();
      this.boss = undefined;
    }
  }

  clearBullets(): void {
    this.bulletPool.recycleAll();
  }

  getBossBulletGroup(): Phaser.GameObjects.Group {
    return this.bulletPool.getGroup();
  }

  getBossGroup(): Phaser.GameObjects.Group {
    return this.bossGroup;
  }

  getStatus(): BossStatus | null {
    if (!this.boss?.active) {
      return null;
    }

    return this.boss.getStatus();
  }

  update(
    timeMs: number,
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
    player?: PlayerPlane,
  ): void {
    this.boss?.updateBoss(timeMs, deltaMs, bounds, this.bulletPool, player);
    this.bulletPool.update(deltaMs, bounds);

    if (this.boss && !this.boss.active) {
      this.bossGroup.remove(this.boss, false, false);
      this.boss.destroy();
      this.boss = undefined;
    }
  }
}
