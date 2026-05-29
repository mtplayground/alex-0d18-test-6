import Phaser from 'phaser';
import { PlayerBullet } from '../entities/PlayerBullet';

const DEFAULT_POOL_SIZE = 32;

export class PlayerBulletPool {
  private readonly bullets: PlayerBullet[];

  constructor(scene: Phaser.Scene, size = DEFAULT_POOL_SIZE) {
    this.bullets = Array.from({ length: size }, () => new PlayerBullet(scene));
  }

  fire(x: number, y: number): boolean {
    const bullet = this.bullets.find((candidate) => !candidate.active);

    if (!bullet) {
      return false;
    }

    bullet.fire(x, y);
    return true;
  }

  update(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    for (const bullet of this.bullets) {
      bullet.update(deltaMs, bounds);
    }
  }
}
