import Phaser from 'phaser';
import { PlayerBullet } from '../entities/PlayerBullet';
import type { WeaponLevel } from '../state/GameState';
import {
  canFirePlayerBulletPattern,
  getPlayerBulletPattern,
} from './playerBulletPatterns';

const DEFAULT_POOL_SIZE = 64;

export class PlayerBulletPool {
  private readonly bullets: PlayerBullet[];

  private readonly group: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, size = DEFAULT_POOL_SIZE) {
    this.group = scene.add.group();
    this.bullets = Array.from({ length: size }, () => new PlayerBullet(scene));

    for (const bullet of this.bullets) {
      this.group.add(bullet);
    }
  }

  firePattern(x: number, y: number, weaponLevel: WeaponLevel): boolean {
    const pattern = getPlayerBulletPattern(weaponLevel);
    const availableBullets = this.bullets.filter((candidate) => {
      return !candidate.active;
    });

    if (!canFirePlayerBulletPattern(availableBullets.length, weaponLevel)) {
      return false;
    }

    pattern.forEach((shot, index) => {
      availableBullets[index].fire(x + shot.offsetX, y, shot.horizontalSpeed);
    });

    return true;
  }

  getGroup(): Phaser.GameObjects.Group {
    return this.group;
  }

  update(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    for (const bullet of this.bullets) {
      bullet.update(deltaMs, bounds);
    }
  }
}
