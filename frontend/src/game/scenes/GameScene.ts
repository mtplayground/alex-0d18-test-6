import Phaser from 'phaser';
import { PlayerPlane } from '../entities/PlayerPlane';
import { AssetKeys, SceneKeys } from '../keys';
import { PlayerBulletPool } from '../systems/PlayerBulletPool';

const FIRE_INTERVAL_MS = 140;

type MovementKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private bullets?: PlayerBulletPool;

  private bounds?: Phaser.Geom.Rectangle;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private fireKey?: Phaser.Input.Keyboard.Key;

  private nextShotAt = 0;

  private player?: PlayerPlane;

  private wasd?: MovementKeys;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .image(width / 2, height / 2, AssetKeys.MenuBackground)
      .setDisplaySize(width, height)
      .setAlpha(0.52);

    this.bounds = new Phaser.Geom.Rectangle(0, 0, width, height);
    this.bullets = new PlayerBulletPool(this);
    this.player = new PlayerPlane(this, width / 2, height * 0.78);

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is not available for player movement.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.fireKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(time: number, delta: number): void {
    if (
      !this.bounds ||
      !this.bullets ||
      !this.cursors ||
      !this.fireKey ||
      !this.player ||
      !this.wasd
    ) {
      return;
    }

    const direction = new Phaser.Math.Vector2(
      Number(this.isRightDown()) - Number(this.isLeftDown()),
      Number(this.isDownDown()) - Number(this.isUpDown()),
    );

    this.player.move(direction, delta, this.bounds);
    this.firePlayerBullet(time);
    this.bullets.update(delta, this.bounds);
  }

  private firePlayerBullet(time: number): void {
    if (!this.bullets || !this.fireKey || !this.player) {
      return;
    }

    if (!this.fireKey.isDown || time < this.nextShotAt) {
      return;
    }

    const fired = this.bullets.fire(
      this.player.x,
      this.player.y - this.player.displayHeight / 2,
    );

    if (fired) {
      this.nextShotAt = time + FIRE_INTERVAL_MS;
    }
  }

  private isUpDown(): boolean {
    return this.cursors?.up.isDown === true || this.wasd?.up.isDown === true;
  }

  private isDownDown(): boolean {
    return (
      this.cursors?.down.isDown === true || this.wasd?.down.isDown === true
    );
  }

  private isLeftDown(): boolean {
    return (
      this.cursors?.left.isDown === true || this.wasd?.left.isDown === true
    );
  }

  private isRightDown(): boolean {
    return (
      this.cursors?.right.isDown === true || this.wasd?.right.isDown === true
    );
  }
}
