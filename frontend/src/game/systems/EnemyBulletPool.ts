import Phaser from 'phaser';
import { EnemyBullet } from '../entities/EnemyBullet';

const DEFAULT_POOL_SIZE = 80;

export class EnemyBulletPool {
  private readonly bullets: EnemyBullet[];

  constructor(scene: Phaser.Scene, size = DEFAULT_POOL_SIZE) {
    this.bullets = Array.from({ length: size }, () => new EnemyBullet(scene));
  }

  fire(x: number, y: number, velocity: Phaser.Math.Vector2): boolean {
    const bullet = this.bullets.find((candidate) => !candidate.active);

    if (!bullet) {
      return false;
    }

    bullet.fire(x, y, velocity);
    return true;
  }

  recycleAll(): void {
    for (const bullet of this.bullets) {
      bullet.recycle();
    }
  }

  update(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    for (const bullet of this.bullets) {
      bullet.update(deltaMs, bounds);
    }
  }
}
