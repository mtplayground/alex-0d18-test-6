import Phaser from 'phaser';
import { PlayerPlane } from '../entities/PlayerPlane';
import { AssetKeys, SceneKeys } from '../keys';

type MovementKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private bounds?: Phaser.Geom.Rectangle;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

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
    this.player = new PlayerPlane(this, width / 2, height * 0.78);

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is not available for player movement.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(_time: number, delta: number): void {
    if (!this.bounds || !this.cursors || !this.player || !this.wasd) {
      return;
    }

    const direction = new Phaser.Math.Vector2(
      Number(this.isRightDown()) - Number(this.isLeftDown()),
      Number(this.isDownDown()) - Number(this.isUpDown()),
    );

    this.player.move(direction, delta, this.bounds);
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
