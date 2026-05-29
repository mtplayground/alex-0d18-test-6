import Phaser from 'phaser';
import { AssetKeys } from '../keys';
import type { EnemyBulletPool } from '../systems/EnemyBulletPool';

export type EnemyKind = 'straight' | 'zigzag' | 'dive';

type EnemyConfig = {
  bulletSpeed: number;
  fireIntervalMs: number;
  health: number;
  scoreValue: number;
  speed: number;
};

const ENEMY_CONFIG: Record<EnemyKind, EnemyConfig> = {
  straight: {
    bulletSpeed: 240,
    fireIntervalMs: 1_500,
    health: 2,
    scoreValue: 80,
    speed: 92,
  },
  zigzag: {
    bulletSpeed: 220,
    fireIntervalMs: 1_900,
    health: 3,
    scoreValue: 120,
    speed: 76,
  },
  dive: {
    bulletSpeed: 280,
    fireIntervalMs: 1_250,
    health: 2,
    scoreValue: 150,
    speed: 136,
  },
};

const ENEMY_ASSETS: Record<EnemyKind, string> = {
  straight: AssetKeys.EnemyStraight,
  zigzag: AssetKeys.EnemyZigZag,
  dive: AssetKeys.EnemyDive,
};

export abstract class Enemy extends Phaser.GameObjects.Sprite {
  readonly kind: EnemyKind;

  readonly scoreValue: number;

  protected elapsedMs = 0;

  protected fireIntervalMs: number;

  protected health: number;

  protected nextShotAt = 0;

  protected spawnX: number;

  protected spawnY: number;

  protected speed: number;

  private readonly bulletSpeed: number;

  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number) {
    const config = ENEMY_CONFIG[kind];

    super(scene, x, y, ENEMY_ASSETS[kind]);

    this.kind = kind;
    this.scoreValue = config.scoreValue;
    this.fireIntervalMs = config.fireIntervalMs;
    this.health = config.health;
    this.speed = config.speed;
    this.bulletSpeed = config.bulletSpeed;
    this.spawnX = x;
    this.spawnY = y;

    scene.add.existing(this);
    this.setActive(true);
    this.setDepth(6);
    this.setDisplaySize(54, 54);
  }

  updateEnemy(
    timeMs: number,
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
    bulletPool: EnemyBulletPool,
    player?: Phaser.GameObjects.Sprite,
  ): void {
    if (!this.active) {
      return;
    }

    this.elapsedMs += deltaMs;
    this.updateMovement(deltaMs, bounds, player);
    this.tryShoot(timeMs, bulletPool, player);

    if (this.getTopCenter().y > bounds.bottom + this.displayHeight) {
      this.recycle();
    }
  }

  takeDamage(damage: number): boolean {
    if (!this.active || damage <= 0) {
      return false;
    }

    this.health -= damage;

    if (this.health > 0) {
      return false;
    }

    this.recycle();
    return true;
  }

  recycle(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);
  }

  protected abstract updateMovement(
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
    player?: Phaser.GameObjects.Sprite,
  ): void;

  protected shoot(
    bulletPool: EnemyBulletPool,
    direction: Phaser.Math.Vector2,
  ): boolean {
    if (direction.lengthSq() === 0) {
      return false;
    }

    const velocity = direction.normalize().scale(this.bulletSpeed);
    return bulletPool.fire(this.x, this.y + this.displayHeight / 2, velocity);
  }

  protected shootDown(bulletPool: EnemyBulletPool): boolean {
    return this.shoot(bulletPool, new Phaser.Math.Vector2(0, 1));
  }

  protected shouldShoot(timeMs: number): boolean {
    if (timeMs < this.nextShotAt) {
      return false;
    }

    this.nextShotAt = timeMs + this.fireIntervalMs;
    return true;
  }

  protected abstract tryShoot(
    timeMs: number,
    bulletPool: EnemyBulletPool,
    player?: Phaser.GameObjects.Sprite,
  ): void;
}

export class StraightEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'straight', x, y);
  }

  protected updateMovement(deltaMs: number): void {
    this.y += this.speed * (deltaMs / 1000);
  }

  protected tryShoot(timeMs: number, bulletPool: EnemyBulletPool): void {
    if (this.shouldShoot(timeMs)) {
      this.shootDown(bulletPool);
    }
  }
}

export class ZigZagEnemy extends Enemy {
  private readonly amplitude = 58;

  private readonly frequency = 0.0048;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'zigzag', x, y);
  }

  protected updateMovement(
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
  ): void {
    this.y += this.speed * (deltaMs / 1000);
    this.x = Phaser.Math.Clamp(
      this.spawnX + Math.sin(this.elapsedMs * this.frequency) * this.amplitude,
      bounds.left + this.displayWidth / 2,
      bounds.right - this.displayWidth / 2,
    );
  }

  protected tryShoot(timeMs: number, bulletPool: EnemyBulletPool): void {
    if (!this.shouldShoot(timeMs)) {
      return;
    }

    this.shoot(bulletPool, new Phaser.Math.Vector2(-0.35, 1));
    this.shoot(bulletPool, new Phaser.Math.Vector2(0.35, 1));
  }
}

export class DiveEnemy extends Enemy {
  private targetX: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'dive', x, y);
  }

  protected updateMovement(
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
    player?: Phaser.GameObjects.Sprite,
  ): void {
    if (this.targetX === null) {
      this.targetX = player?.x ?? this.x;
    }

    const deltaSeconds = deltaMs / 1000;
    const nextX = Phaser.Math.Linear(this.x, this.targetX, 0.026);

    this.x = Phaser.Math.Clamp(
      nextX,
      bounds.left + this.displayWidth / 2,
      bounds.right - this.displayWidth / 2,
    );
    this.y += this.speed * deltaSeconds;
  }

  protected tryShoot(
    timeMs: number,
    bulletPool: EnemyBulletPool,
    player?: Phaser.GameObjects.Sprite,
  ): void {
    if (!this.shouldShoot(timeMs)) {
      return;
    }

    if (!player) {
      this.shootDown(bulletPool);
      return;
    }

    this.shoot(
      bulletPool,
      new Phaser.Math.Vector2(player.x - this.x, player.y - this.y),
    );
  }
}
