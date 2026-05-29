import Phaser from 'phaser';
import enemyBulletUrl from '../assets/enemy-bullet.svg';
import enemyDiveUrl from '../assets/enemy-dive.svg';
import enemyStraightUrl from '../assets/enemy-straight.svg';
import enemyZigZagUrl from '../assets/enemy-zigzag.svg';
import menuBackgroundUrl from '../assets/menu-background.svg';
import menuEmblemUrl from '../assets/menu-emblem.svg';
import playerBulletUrl from '../assets/player-bullet.svg';
import playerPlaneUrl from '../assets/player-plane.svg';
import starfieldBackgroundUrl from '../assets/starfield-background.svg';
import { AssetKeys, SceneKeys } from '../keys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    const { width, height } = this.scale;
    const barWidth = Math.min(width * 0.72, 320);
    const barX = (width - barWidth) / 2;
    const barY = height * 0.58;

    const track = this.add
      .rectangle(barX, barY, barWidth, 8, 0x334155)
      .setOrigin(0, 0.5);
    const fill = this.add
      .rectangle(barX, barY, 0, 8, 0x67e8f9)
      .setOrigin(0, 0.5);

    this.load.on('progress', (progress: number) => {
      fill.width = barWidth * progress;
    });

    this.load.once('complete', () => {
      track.destroy();
      fill.destroy();
    });

    this.load.image(AssetKeys.EnemyBullet, enemyBulletUrl);
    this.load.image(AssetKeys.EnemyDive, enemyDiveUrl);
    this.load.image(AssetKeys.EnemyStraight, enemyStraightUrl);
    this.load.image(AssetKeys.EnemyZigZag, enemyZigZagUrl);
    this.load.image(AssetKeys.MenuBackground, menuBackgroundUrl);
    this.load.image(AssetKeys.MenuEmblem, menuEmblemUrl);
    this.load.image(AssetKeys.PlayerBullet, playerBulletUrl);
    this.load.image(AssetKeys.PlayerPlane, playerPlaneUrl);
    this.load.image(AssetKeys.StarfieldBackground, starfieldBackgroundUrl);
  }

  create(): void {
    this.scene.start(SceneKeys.MainMenu);
  }
}
