import Phaser from 'phaser';
import { AssetKeys } from '../keys';

export type PickupType = 'weapon' | 'shield' | 'bomb';

const PICKUP_ASSETS: Record<PickupType, string> = {
  weapon: AssetKeys.PickupWeapon,
  shield: AssetKeys.PickupShield,
  bomb: AssetKeys.PickupBomb,
};

const FALL_SPEED = 94;
const DRIFT_AMPLITUDE = 16;
const DRIFT_FREQUENCY = 0.004;

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  pickupType: PickupType = 'weapon';

  private elapsedMs = 0;

  private spawnX = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, AssetKeys.PickupWeapon);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setDepth(7);
    this.setDisplaySize(38, 38);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setEnable(false);
    body.setSize(30, 30);
    body.setOffset(17, 17);
  }

  spawn(type: PickupType, x: number, y: number): void {
    this.pickupType = type;
    this.spawnX = x;
    this.elapsedMs = 0;
    this.setTexture(PICKUP_ASSETS[type]);
    this.setPosition(x, y);
    this.setRotation(0);
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);
    body.updateFromGameObject();
  }

  updatePickup(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    if (!this.active) {
      return;
    }

    this.elapsedMs += deltaMs;
    this.y += FALL_SPEED * (deltaMs / 1000);
    this.x =
      this.spawnX +
      Math.sin(this.elapsedMs * DRIFT_FREQUENCY) * DRIFT_AMPLITUDE;
    this.rotation += 0.0018 * deltaMs;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.updateFromGameObject();

    if (this.getTopCenter().y > bounds.bottom + this.displayHeight) {
      this.recycle();
    }
  }

  recycle(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);
    this.setRotation(0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);
    body.updateFromGameObject();
  }
}
