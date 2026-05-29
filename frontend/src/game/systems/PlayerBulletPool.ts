import Phaser from 'phaser';
import { PlayerBullet } from '../entities/PlayerBullet';
import type { WeaponLevel } from '../state/GameState';

const DEFAULT_POOL_SIZE = 64;

type BulletPatternItem = {
  horizontalSpeed: number;
  offsetX: number;
};

const WEAPON_PATTERNS: Record<WeaponLevel, BulletPatternItem[]> = {
  1: [{ horizontalSpeed: 0, offsetX: 0 }],
  2: [
    { horizontalSpeed: -180, offsetX: -14 },
    { horizontalSpeed: 0, offsetX: 0 },
    { horizontalSpeed: 180, offsetX: 14 },
  ],
  3: [
    { horizontalSpeed: -260, offsetX: -24 },
    { horizontalSpeed: -130, offsetX: -12 },
    { horizontalSpeed: 0, offsetX: 0 },
    { horizontalSpeed: 130, offsetX: 12 },
    { horizontalSpeed: 260, offsetX: 24 },
  ],
};

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
    const pattern = WEAPON_PATTERNS[weaponLevel];
    const availableBullets = this.bullets.filter((candidate) => {
      return !candidate.active;
    });

    if (availableBullets.length < pattern.length) {
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
