import Phaser from 'phaser';
import { AssetKeys } from '../keys';

const PLAYER_SPEED = 260;
const INVULNERABLE_FLASH_INTERVAL_MS = 90;

export class PlayerPlane extends Phaser.GameObjects.Sprite {
  private readonly shieldRing: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKeys.PlayerPlane);

    scene.add.existing(this);
    this.setDisplaySize(64, 64);
    this.setDepth(10);

    this.shieldRing = scene.add.graphics();
    this.shieldRing.setDepth(9);
  }

  move(
    direction: Phaser.Math.Vector2,
    deltaMs: number,
    bounds: Phaser.Geom.Rectangle,
  ): void {
    if (direction.lengthSq() > 0) {
      direction.normalize();
    }

    const distance = PLAYER_SPEED * (deltaMs / 1000);
    const nextX = this.x + direction.x * distance;
    const nextY = this.y + direction.y * distance;
    const halfWidth = this.displayWidth / 2;
    const halfHeight = this.displayHeight / 2;

    this.setPosition(
      Phaser.Math.Clamp(
        nextX,
        bounds.left + halfWidth,
        bounds.right - halfWidth,
      ),
      Phaser.Math.Clamp(
        nextY,
        bounds.top + halfHeight,
        bounds.bottom - halfHeight,
      ),
    );
  }

  updateStatusEffects(
    timeMs: number,
    isInvulnerable: boolean,
    hasShield: boolean,
  ): void {
    this.updateInvulnerabilityFlash(timeMs, isInvulnerable);
    this.updateShieldRing(hasShield);
  }

  private updateInvulnerabilityFlash(
    timeMs: number,
    isInvulnerable: boolean,
  ): void {
    if (!isInvulnerable) {
      this.setAlpha(1);
      return;
    }

    const flashFrame =
      Math.floor(timeMs / INVULNERABLE_FLASH_INTERVAL_MS) % 2 === 0;

    this.setAlpha(flashFrame ? 0.38 : 1);
  }

  private updateShieldRing(hasShield: boolean): void {
    this.shieldRing.clear();

    if (!hasShield) {
      return;
    }

    this.shieldRing.lineStyle(3, 0x67e8f9, 0.82);
    this.shieldRing.strokeCircle(
      this.x,
      this.y,
      Math.max(38, this.displayWidth / 2 + 8),
    );
  }
}
