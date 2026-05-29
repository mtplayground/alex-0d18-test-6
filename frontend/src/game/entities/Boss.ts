import Phaser from 'phaser';
import { AssetKeys } from '../keys';
import type { PlayerPlane } from './PlayerPlane';
import type { EnemyBulletPool } from '../systems/EnemyBulletPool';

export type BossPhase = 1 | 2;

export type BossType = 'command';

export type BossStatus = {
  health: number;
  maxHealth: number;
  phase: BossPhase;
};

const BOSS_MAX_HEALTH = 80;
const BOSS_SCORE_VALUE = 2_000;
const BOSS_TARGET_Y = 132;
const BOSS_ENTRY_SPEED = 78;
const BOSS_SWAY_AMPLITUDE = 96;
const BOSS_SWAY_SPEED = 0.0016;
const PHASE_ONE_INTERVAL_MS = 1_050;
const PHASE_TWO_INTERVAL_MS = 720;
const PHASE_ONE_BULLET_SPEED = 220;
const PHASE_TWO_BULLET_SPEED = 260;

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly scoreValue = BOSS_SCORE_VALUE;

  private elapsedMs = 0;

  private health = BOSS_MAX_HEALTH;

  private nextAttackAt = 0;

  private phase: BossPhase = 1;

  private readonly spawnX: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKeys.BossCommand);

    this.spawnX = x;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setDepth(6);
    this.setDisplaySize(132, 110);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(112, 80);
    body.setOffset(34, 38);
  }

  getStatus(): BossStatus {
    return {
      health: this.health,
      maxHealth: BOSS_MAX_HEALTH,
      phase: this.phase,
    };
  }

  takeDamage(damage: number): boolean {
    if (!this.active || damage <= 0) {
      return false;
    }

    this.health = Math.max(0, this.health - damage);

    if (this.phase === 1 && this.health <= BOSS_MAX_HEALTH / 2) {
      this.phase = 2;
      this.nextAttackAt = 0;
    }

    if (this.health > 0) {
      return false;
    }

    this.recycle();
    return true;
  }

  recycle(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-200, -200);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);
    body.updateFromGameObject();
  }

  updateBoss(
    timeMs: number,
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
    bulletPool: EnemyBulletPool,
    player?: PlayerPlane,
  ): void {
    if (!this.active) {
      return;
    }

    this.elapsedMs += deltaMs;
    this.updateMovement(deltaMs, bounds);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.updateFromGameObject();

    this.attack(timeMs, bulletPool, player);
  }

  private updateMovement(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    if (this.y < BOSS_TARGET_Y) {
      this.y += BOSS_ENTRY_SPEED * (deltaMs / 1000);
    }

    this.x = Phaser.Math.Clamp(
      this.spawnX +
        Math.sin(this.elapsedMs * BOSS_SWAY_SPEED) * BOSS_SWAY_AMPLITUDE,
      bounds.left + this.displayWidth / 2,
      bounds.right - this.displayWidth / 2,
    );
  }

  private attack(
    timeMs: number,
    bulletPool: EnemyBulletPool,
    player?: PlayerPlane,
  ): void {
    const interval =
      this.phase === 1 ? PHASE_ONE_INTERVAL_MS : PHASE_TWO_INTERVAL_MS;

    if (timeMs < this.nextAttackAt) {
      return;
    }

    this.nextAttackAt = timeMs + interval;

    if (this.phase === 1) {
      this.fireSpread(bulletPool);
      return;
    }

    this.firePhaseTwoPattern(bulletPool, player);
  }

  private fireSpread(bulletPool: EnemyBulletPool): void {
    for (const x of [-0.38, 0, 0.38]) {
      this.fireBullet(
        bulletPool,
        new Phaser.Math.Vector2(x, 1),
        PHASE_ONE_BULLET_SPEED,
      );
    }
  }

  private firePhaseTwoPattern(
    bulletPool: EnemyBulletPool,
    player?: PlayerPlane,
  ): void {
    for (const x of [-0.75, -0.38, 0, 0.38, 0.75]) {
      this.fireBullet(
        bulletPool,
        new Phaser.Math.Vector2(x, 1),
        PHASE_TWO_BULLET_SPEED,
      );
    }

    if (!player) {
      return;
    }

    this.fireBullet(
      bulletPool,
      new Phaser.Math.Vector2(player.x - this.x, player.y - this.y),
      PHASE_TWO_BULLET_SPEED + 40,
    );
  }

  private fireBullet(
    bulletPool: EnemyBulletPool,
    direction: Phaser.Math.Vector2,
    speed: number,
  ): void {
    if (direction.lengthSq() === 0) {
      return;
    }

    bulletPool.fire(
      this.x,
      this.y + this.displayHeight / 2,
      direction.normalize().scale(speed),
    );
  }
}
