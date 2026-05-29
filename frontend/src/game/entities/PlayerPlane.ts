import Phaser from 'phaser';
import { AssetKeys } from '../keys';

const PLAYER_SPEED = 260;

export class PlayerPlane extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKeys.PlayerPlane);

    scene.add.existing(this);
    this.setDisplaySize(64, 64);
    this.setDepth(10);
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
}
