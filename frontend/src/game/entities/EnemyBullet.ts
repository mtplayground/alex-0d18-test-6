import Phaser from 'phaser';
import { AssetKeys } from '../keys';

export class EnemyBullet extends Phaser.GameObjects.Sprite {
  private velocity = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, AssetKeys.EnemyBullet);

    scene.add.existing(this);
    this.setActive(false);
    this.setDepth(7);
    this.setDisplaySize(14, 24);
    this.setVisible(false);
  }

  fire(x: number, y: number, velocity: Phaser.Math.Vector2): void {
    this.velocity = velocity.clone();
    this.setPosition(x, y);
    this.setRotation(
      Phaser.Math.Angle.Between(0, 0, this.velocity.x, this.velocity.y) -
        Math.PI / 2,
    );
    this.setActive(true);
    this.setVisible(true);
  }

  recycle(): void {
    this.velocity.set(0, 0);
    this.setRotation(0);
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);
  }

  update(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    if (!this.active) {
      return;
    }

    const deltaSeconds = deltaMs / 1000;
    this.x += this.velocity.x * deltaSeconds;
    this.y += this.velocity.y * deltaSeconds;

    if (
      this.getTopCenter().y > bounds.bottom ||
      this.getRightCenter().x < bounds.left ||
      this.getLeftCenter().x > bounds.right
    ) {
      this.recycle();
    }
  }
}
