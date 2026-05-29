import Phaser from 'phaser';
import type { BossStatus } from '../entities/Boss';

const BAR_WIDTH = 300;
const BAR_HEIGHT = 12;

export class BossHealthBar {
  private readonly fill: Phaser.GameObjects.Graphics;

  private readonly label: Phaser.GameObjects.Text;

  private readonly track: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    const { width } = scene.scale;
    const x = (width - BAR_WIDTH) / 2;
    const y = 108;

    this.label = scene.add.text(width / 2, y - 22, '', {
      color: '#fef3c7',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    });
    this.label.setOrigin(0.5, 0);

    this.track = scene.add.graphics();
    this.track.fillStyle(0x1e293b, 0.9);
    this.track.fillRoundedRect(x, y, BAR_WIDTH, BAR_HEIGHT, 4);

    this.fill = scene.add.graphics();

    for (const item of [this.label, this.track, this.fill]) {
      item.setDepth(102);
      item.setScrollFactor(0);
      item.setVisible(false);
    }
  }

  hide(): void {
    this.label.setVisible(false);
    this.track.setVisible(false);
    this.fill.setVisible(false);
  }

  update(status: BossStatus | null): void {
    if (!status) {
      this.hide();
      return;
    }

    const ratio = Phaser.Math.Clamp(status.health / status.maxHealth, 0, 1);

    this.label.setText(`BOSS PHASE ${status.phase}`);
    this.label.setVisible(true);
    this.track.setVisible(true);
    this.fill.setVisible(true);

    this.fill.clear();
    this.fill.fillStyle(status.phase === 1 ? 0xef4444 : 0xfacc15, 1);
    this.fill.fillRoundedRect(
      (this.fill.scene.scale.width - BAR_WIDTH) / 2,
      108,
      BAR_WIDTH * ratio,
      BAR_HEIGHT,
      4,
    );
  }
}
