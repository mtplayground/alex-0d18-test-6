import Phaser from 'phaser';
import { AssetKeys } from '../keys';

const BULLET_SPEED = 640;

export class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
  private horizontalSpeed = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, AssetKeys.PlayerBullet);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setDepth(8);
    this.setDisplaySize(14, 30);
    this.setVisible(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setEnable(false);
    body.setSize(10, 26);
  }

  fire(x: number, y: number, horizontalSpeed = 0): void {
    this.horizontalSpeed = horizontalSpeed;
    this.setPosition(x, y);
    this.setRotation(
      Phaser.Math.Angle.Between(0, 0, horizontalSpeed, -BULLET_SPEED) +
        Math.PI / 2,
    );
    this.setActive(true);
    this.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);
    body.updateFromGameObject();
  }

  recycle(): void {
    this.horizontalSpeed = 0;
    this.setRotation(0);
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);
    body.updateFromGameObject();
  }

  update(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    if (!this.active) {
      return;
    }

    this.x += this.horizontalSpeed * (deltaMs / 1000);
    this.y -= BULLET_SPEED * (deltaMs / 1000);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.updateFromGameObject();

    if (
      this.getBottomCenter().y < bounds.top ||
      this.getRightCenter().x < bounds.left ||
      this.getLeftCenter().x > bounds.right
    ) {
      this.recycle();
    }
  }
}
