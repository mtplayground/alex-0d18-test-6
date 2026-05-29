import Phaser from 'phaser';
import { AssetKeys } from '../keys';

const FAR_SCROLL_SPEED = 34;
const NEAR_SCROLL_SPEED = 86;

export class ScrollingBackground {
  private readonly farLayer: Phaser.GameObjects.TileSprite;

  private readonly nearLayer: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.farLayer = scene.add
      .tileSprite(
        width / 2,
        height / 2,
        width,
        height,
        AssetKeys.StarfieldBackground,
      )
      .setAlpha(0.72)
      .setDepth(0);

    this.nearLayer = scene.add
      .tileSprite(
        width / 2,
        height / 2,
        width,
        height,
        AssetKeys.StarfieldBackground,
      )
      .setAlpha(0.32)
      .setDepth(1)
      .setScale(1.18);
  }

  update(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;

    this.farLayer.tilePositionY -= FAR_SCROLL_SPEED * deltaSeconds;
    this.nearLayer.tilePositionY -= NEAR_SCROLL_SPEED * deltaSeconds;
  }
}
