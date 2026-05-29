import Phaser from 'phaser';
import { AssetKeys } from '../keys';

const BULLET_SPEED = 640;

export class PlayerBullet extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, AssetKeys.PlayerBullet);

    scene.add.existing(this);
    this.setActive(false);
    this.setDepth(8);
    this.setDisplaySize(14, 30);
    this.setVisible(false);
  }

  fire(x: number, y: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
  }

  recycle(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);
  }

  update(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    if (!this.active) {
      return;
    }

    this.y -= BULLET_SPEED * (deltaMs / 1000);

    if (this.getBottomCenter().y < bounds.top) {
      this.recycle();
    }
  }
}
